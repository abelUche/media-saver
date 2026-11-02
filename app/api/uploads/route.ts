import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId } from '@/lib/auth';
import { saveUpload } from '@/lib/uploads';
import { ApiError, errorResponse } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      throw new ApiError('Not logged in or invalid API key', 401);
    }

    const formData = await request.formData().catch(() => null);
    if (!formData) {
      throw new ApiError('Send the request as multipart form data', 400);
    }

    const upload = await saveUpload(userId, formData.get('file'));
    return NextResponse.json({ id: upload.id, url: upload.publicUrl }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}