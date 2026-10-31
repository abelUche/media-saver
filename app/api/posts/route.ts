import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { getAuthenticatedUserId } from '@/lib/auth';
import { db } from '@/lib/db';
import { uploads } from '@/lib/db/schema';
import { getAccessToken, bufferRequest, BufferApiError } from '@/lib/buffer';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type CreatePostResult = {
  createPost: {
    post?: { id: string; status: string; dueAt: string | null };
    message?: string;
  };
};

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

export async function POST(request: NextRequest) {
    const userId = await getAuthenticatedUserId(request);
   if (!userId) {
     return NextResponse.json({ error: 'Not logged in or invalid API key' }, { status: 401 });
   }

  const body = await request.json().catch(() => null);
  const { uploadId, channelId, text, dueAt, draft } = body ?? {};

  if (
    typeof uploadId !== 'string' ||
    !UUID_PATTERN.test(uploadId) ||
    typeof channelId !== 'string' ||
    typeof text !== 'string' ||
    !text.trim()
  ) {
    return NextResponse.json(
      { error: 'uploadId, channelId and text are required' },
      { status: 400 },
    );
  }
  if (dueAt !== undefined && (typeof dueAt !== 'string' || Number.isNaN(Date.parse(dueAt)))) {
    return NextResponse.json({ error: 'dueAt must be an ISO 8601 date' }, { status: 400 });
  }

  const [upload] = await db
    .select()
    .from(uploads)
    .where(and(eq(uploads.id, uploadId), eq(uploads.userId, userId)));

  if (!upload) {
    return NextResponse.json({ error: 'Upload not found' }, { status: 404 });
  }
  if (upload.status !== 'pending' || upload.bufferPostId) {
    return NextResponse.json(
      { error: 'This upload already has a post', postId: upload.bufferPostId },
      { status: 409 },
    );
  }

  try {
    const accessToken = await getAccessToken(userId);
    const scheduled = typeof dueAt === 'string';

    const data = await bufferRequest<CreatePostResult>(accessToken, buildMutation(scheduled), {
      channelId,
      text,
      imageUrl: upload.publicUrl,
      saveToDraft: draft === true,
      ...(scheduled ? { dueAt: new Date(dueAt).toISOString() } : {}),
    });

    const post = data.createPost.post;
    if (!post) {
      return NextResponse.json(
        { error: data.createPost.message ?? 'Buffer rejected the post' },
        { status: 422 },
      );
    }

    await db
      .update(uploads)
      .set({ status: 'scheduled', bufferPostId: post.id })
      .where(eq(uploads.id, upload.id));

    return NextResponse.json(
      { uploadId: upload.id, postId: post.id, status: post.status, dueAt: post.dueAt },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof BufferApiError) {
      const headers = error.retryAfter ? { 'Retry-After': String(error.retryAfter) } : undefined;
      return NextResponse.json({ error: error.message }, { status: error.status, headers });
    }
    throw error;
  }
}