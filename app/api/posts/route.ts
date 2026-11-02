import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { uploads } from '@/lib/db/schema';
import { getAuthenticatedUserId } from '@/lib/auth';
import { parsePostOptions, createPostForUpload } from '@/lib/posts';
import { ApiError, errorResponse } from '@/lib/errors';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      throw new ApiError('Not logged in or invalid API key', 401);
    }

    const body = await request.json().catch(() => null);
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

    const result = await createPostForUpload(userId, upload, options);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}