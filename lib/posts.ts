import { and, eq } from 'drizzle-orm';
import { getFileInfo, deleteFile } from '@/lib/r2';
import { MAX_DIRECT_UPLOAD_BYTES } from '@/lib/uploads';
import { db } from '@/lib/db';
import { uploads } from '@/lib/db/schema';
import { getAccessToken, bufferRequest } from '@/lib/buffer';
import { ApiError } from '@/lib/errors';

type Upload = typeof uploads.$inferSelect;

export type PostOptions = {
  channelId: string;
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

export function parsePostOptions(input: Record<string, unknown>): PostOptions {
  const { channelId, text, dueAt, draft } = input;

  if (typeof channelId !== 'string' || !channelId.trim()) {
    throw new ApiError('channelId is required', 400);
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

  return {
    channelId: channelId.trim(),
    text,
    dueAt: normalizedDueAt,
    draft: draft === true || draft === 'true',
  };
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

export async function createPostForUpload(userId: string, upload: Upload, options: PostOptions) {
  if (upload.status !== 'pending' || upload.bufferPostId) {
    throw new ApiError('This upload already has a post', 409, undefined, {
      postId: upload.bufferPostId,
    });
  }

  const accessToken = await getAccessToken(userId);
  const scheduled = Boolean(options.dueAt);

  const data = await bufferRequest<CreatePostResult>(accessToken, buildMutation(scheduled), {
    channelId: options.channelId,
    text: options.text,
    imageUrl: upload.publicUrl,
    saveToDraft: options.draft,
    ...(scheduled ? { dueAt: options.dueAt } : {}),
  });

  const post = data.createPost.post;
  if (!post) {
    throw new ApiError(data.createPost.message ?? 'Buffer rejected the post', 422);
  }

  await db
    .update(uploads)
    .set({ 
        status: 'scheduled', 
        bufferPostId: post.id,
        channelId: options.channelId,
        dueAt: post.dueAt ? new Date(post.dueAt) : null,
     })
    .where(eq(uploads.id, upload.id));

  return { uploadId: upload.id, postId: post.id, status: post.status, dueAt: post.dueAt };
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