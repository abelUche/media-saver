import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId } from '@/lib/auth';
import { saveUpload } from '@/lib/uploads';
import { parsePostOptions, createPostForUpload, postExistingUpload } from '@/lib/posts';
import { ApiError, errorResponse } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      throw new ApiError('Not logged in or invalid API key', 401);
    }

    if (request.headers.get('content-type')?.includes('application/json')) {
      const body = await request.json().catch(() => null);
      return NextResponse.json(await postExistingUpload(userId, body), { status: 201 });
    }

    const formData = await request.formData().catch(() => null);
    if (!formData) {
      throw new ApiError('Send the request as multipart form data', 400);
    }

    const options = parsePostOptions({
      channelId: formData.get('channelId'),
      text: formData.get('text'),
      dueAt: formData.get('dueAt'),
      draft: formData.get('draft'),
    });

    const upload = await saveUpload(userId, formData.get('file'));

    try {
      const result = await createPostForUpload(userId, upload, options);
      return NextResponse.json(result, { status: 201 });
    } catch (error) {
      if (error instanceof ApiError) {
        error.extra = { ...error.extra, uploadId: upload.id };
      }
      throw error;
    }
  } catch (error) {
    return errorResponse(error);
  }
}