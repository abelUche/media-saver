import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId } from '@/lib/auth';
import { postExistingUpload } from '@/lib/posts';
import { ApiError, errorResponse } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      throw new ApiError('Not logged in or invalid API key', 401);
    }
    const body = await request.json().catch(() => null);
    return NextResponse.json(await postExistingUpload(userId, body), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}