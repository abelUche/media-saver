import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { uploads, uploadPosts } from '@/lib/db/schema';
import { getAccessToken, bufferRequest, BufferApiError } from '@/lib/buffer';
import { getFileInfo, deleteFile } from '@/lib/r2';
import { MAX_DIRECT_UPLOAD_BYTES } from '@/lib/uploads';
import { ApiError } from '@/lib/errors';

type Upload = typeof uploads.$inferSelect;

export const MAX_CHANNELS = 10;

export type PostOptions = {
  channelIds: string[];
  text: string;
  dueAt?: string;
  draft: boolean;
};

type CreatePostResult = {
  createPost: {
    post?: { id: string; status: string; dueAt: string | null };
    message?: string;
  };
};

type CreatedPost = { channelId: string; postId: string; status: string; dueAt: string | null };
type ChannelError = { channelId: string; error: string };

export function parsePostOptions(input: Record<string, unknown>): PostOptions {
  const { text, dueAt, draft } = input;

  const raw = Array.isArray(input.channelIds)
    ? input.channelIds
    : Array.isArray(input.channelId)
      ? input.channelId
      : [input.channelId];
  const channelIds = [
    ...new Set(
      raw
        .filter((id): id is string => typeof id === 'string' && id.trim() !== '')
        .map((id) => id.trim()),
    ),
  ];

  if (channelIds.length === 0) {
    throw new ApiError('channelId is required', 400);
  }
  if (channelIds.length > MAX_CHANNELS) {
    throw new ApiError(`You can post to up to ${MAX_CHANNELS} channels at once`, 400);
  }
  if (typeof text !== 'string' || !text.trim()) {
    throw new ApiError('text is required', 400);
  }

  let normalizedDueAt: string | undefined;
  if (dueAt !== undefined && dueAt !== null && dueAt !== '') {
    if (typeof dueAt !== 'string' || Number.isNaN(Date.parse(dueAt))) {
      throw new ApiError('dueAt must be an ISO 8601 date, such as 2026-11-05T10:00:00Z', 400);
    }
    normalizedDueAt = new Date(dueAt).toISOString();
  }

  return { channelIds, text, dueAt: normalizedDueAt, draft: draft === true || draft === 'true' };
}

function buildMutation(scheduled: boolean) {
  return `
    mutation CreatePost(
      $channelId: ChannelId!
      $text: String!
      $imageUrl: String!
      $saveToDraft: Boolean!
      ${scheduled ? '$dueAt: DateTime!' : ''}
    ) {
      createPost(input: {
        text: $text
        channelId: $channelId
        schedulingType: automatic
        mode: ${scheduled ? 'customScheduled' : 'addToQueue'}
        ${scheduled ? 'dueAt: $dueAt' : ''}
        saveToDraft: $saveToDraft
        assets: [{ image: { url: $imageUrl } }]
      }) {
        ... on PostActionSuccess {
          post { id status dueAt }
        }
        ... on MutationError {
          message
        }
      }
    }
  `;
}

async function markScheduled(uploadId: string, created: CreatedPost[]) {
  const dueTimes = created.map((post) => post.dueAt);
  const earliest = dueTimes.includes(null)
    ? null
    : new Date(Math.min(...dueTimes.map((time) => Date.parse(time!))));

  await db
    .update(uploads)
    .set({
      status: 'scheduled',
      bufferPostId: created[0].postId,
      channelId: created[0].channelId,
      dueAt: earliest,
    })
    .where(eq(uploads.id, uploadId));
}

export async function createPostForUpload(userId: string, upload: Upload, options: PostOptions) {
  const [existing] = await db
    .select({ id: uploadPosts.id })
    .from(uploadPosts)
    .where(eq(uploadPosts.uploadId, upload.id))
    .limit(1);

  if (upload.status !== 'pending' || upload.bufferPostId || existing) {
    throw new ApiError('This upload already has a post', 409, undefined, {
      postId: upload.bufferPostId,
    });
  }

  const accessToken = await getAccessToken(userId);
  const scheduled = Boolean(options.dueAt);
  const mutation = buildMutation(scheduled);

  const created: CreatedPost[] = [];
  const errors: ChannelError[] = [];
  let rateLimitError: BufferApiError | null = null;

  try {
    for (const channelId of options.channelIds) {
      if (rateLimitError) {
        errors.push({ channelId, error: 'Not attempted: Buffer rate limit reached' });
        continue;
      }
      try {
        const data = await bufferRequest<CreatePostResult>(accessToken, mutation, {
          channelId,
          text: options.text,
          imageUrl: upload.publicUrl,
          saveToDraft: options.draft,
          ...(scheduled ? { dueAt: options.dueAt } : {}),
        });

        const post = data.createPost.post;
        if (!post) {
          errors.push({ channelId, error: data.createPost.message ?? 'Buffer rejected the post' });
          continue;
        }

        await db.insert(uploadPosts).values({
          uploadId: upload.id,
          channelId,
          bufferPostId: post.id,
          dueAt: post.dueAt ? new Date(post.dueAt) : null,
        });
        created.push({ channelId, postId: post.id, status: post.status, dueAt: post.dueAt });
      } catch (error) {
        if (error instanceof BufferApiError && error.status === 429) {
          rateLimitError = error;
          errors.push({ channelId, error: 'Buffer rate limit reached' });
        } else if (error instanceof ApiError) {
          errors.push({ channelId, error: error.message });
        } else {
          throw error;
        }
      }
    }
  } finally {
    if (created.length > 0) {
      await markScheduled(upload.id, created);
    }
  }

  if (created.length === 0) {
    if (rateLimitError) throw rateLimitError;
    throw new ApiError(errors[0]?.error ?? 'Buffer rejected the post', 422, undefined, { errors });
  }

  return {
    uploadId: upload.id,
    postId: created[0].postId,
    status: created[0].status,
    dueAt: created[0].dueAt,
    posts: created,
    errors,
  };
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function postExistingUpload(userId: string, body: Record<string, unknown> | null) {
  if (!body || typeof body.uploadId !== 'string' || !UUID_PATTERN.test(body.uploadId)) {
    throw new ApiError('uploadId is required', 400);
  }

  const options = parsePostOptions(body);

  const [upload] = await db
    .select()
    .from(uploads)
    .where(and(eq(uploads.id, body.uploadId), eq(uploads.userId, userId)));

  if (!upload) {
    throw new ApiError('Upload not found', 404);
  }

  if (upload.status === 'pending' && !upload.bufferPostId) {
    const info = await getFileInfo(upload.r2Key);
    if (!info) {
      throw new ApiError('The file has not been uploaded yet. Upload it to uploadUrl first.', 409);
    }
    if (info.size > MAX_DIRECT_UPLOAD_BYTES) {
      await deleteFile(upload.r2Key);
      throw new ApiError('File is larger than 20 MB', 413);
    }
  }

  return createPostForUpload(userId, upload, options);
}
