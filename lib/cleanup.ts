import { and, eq, isNotNull, isNull, lt, lte, or } from 'drizzle-orm';
import { db } from '@/lib/db';
import { uploads } from '@/lib/db/schema';
import { deleteFile } from '@/lib/r2';
import { getAccessToken, bufferRequest, BufferApiError } from '@/lib/buffer';

const BATCH_SIZE = 50;
const ORPHAN_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const POST_STATUS_QUERY = `
  query GetPost($postId: PostId!) {
    post(input: { id: $postId }) {
      id
      status
    }
  }
`;

type PostStatusResult = { post: { id: string; status: string } | null };
type Upload = typeof uploads.$inferSelect;

export type CleanupSummary = {
  checked: number;
  deleted: number;
  failed: number;
  unchanged: number;
  skipped: number;
  orphansDeleted: number;
  stoppedEarly: boolean;
};

async function removeFile(upload: Upload, statusIfDeleteFails: 'published' | null) {
  try {
    await deleteFile(upload.r2Key);
  } catch (error) {
    console.error(`R2 delete failed for upload ${upload.id}:`, error);
    if (statusIfDeleteFails) {
      await db
        .update(uploads)
        .set({ status: statusIfDeleteFails })
        .where(eq(uploads.id, upload.id));
    }
    return false;
  }

  await db
    .update(uploads)
    .set({ status: 'deleted', deletedAt: new Date() })
    .where(eq(uploads.id, upload.id));
  return true;
}

export async function runCleanup(): Promise<CleanupSummary> {
  const summary: CleanupSummary = {
    checked: 0,
    deleted: 0,
    failed: 0,
    unchanged: 0,
    skipped: 0,
    orphansDeleted: 0,
    stoppedEarly: false,
  };
  const now = new Date();

  const published = await db
    .select()
    .from(uploads)
    .where(eq(uploads.status, 'published'))
    .limit(BATCH_SIZE);

  for (const upload of published) {
    if (await removeFile(upload, 'published')) summary.deleted++;
  }

  const due = await db
    .select()
    .from(uploads)
    .where(
      and(
        eq(uploads.status, 'scheduled'),
        isNotNull(uploads.bufferPostId),
        or(isNull(uploads.dueAt), lte(uploads.dueAt, now)),
      ),
    )
    .limit(BATCH_SIZE);

  const tokens = new Map<string, string | null>();

  for (const upload of due) {
    let token = tokens.get(upload.userId);
    if (token === undefined) {
      try {
        token = await getAccessToken(upload.userId);
      } catch (error) {
        console.error(`No valid token for user ${upload.userId}:`, error);
        token = null;
      }
      tokens.set(upload.userId, token);
    }
    if (!token) {
      summary.skipped++;
      continue;
    }

    let result: PostStatusResult;
    try {
      result = await bufferRequest<PostStatusResult>(token, POST_STATUS_QUERY, {
        postId: upload.bufferPostId,
      });
    } catch (error) {
      if (error instanceof BufferApiError && error.status === 429) {
        summary.stoppedEarly = true;
        break;
      }
            if (error instanceof BufferApiError && error.status === 404) {
        summary.checked++;
        if (await removeFile(upload, 'published')) summary.deleted++;
        continue;
      }
      console.error(`Status check failed for upload ${upload.id}:`, error);
      summary.skipped++;
      continue;
    }

    summary.checked++;
    const status = result.post?.status;

    if (!result.post || status === 'sent') {
      if (await removeFile(upload, 'published')) summary.deleted++;
    } else if (status === 'error') {
      await db.update(uploads).set({ status: 'failed' }).where(eq(uploads.id, upload.id));
      summary.failed++;
    } else {
      summary.unchanged++;
    }
  }

  const orphans = await db
    .select()
    .from(uploads)
    .where(
      and(
        eq(uploads.status, 'pending'),
        lt(uploads.createdAt, new Date(now.getTime() - ORPHAN_AGE_MS)),
      ),
    )
    .limit(BATCH_SIZE);

  for (const upload of orphans) {
    if (await removeFile(upload, null)) summary.orphansDeleted++;
  }

  return summary;
}