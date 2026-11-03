import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId } from '@/lib/auth';
import { createUploadSlot } from '@/lib/uploads';
import { ApiError, errorResponse } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      throw new ApiError('Not logged in or invalid API key', 401);
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      throw new ApiError('Send JSON with fileName, contentType and size', 400);
    }

    return NextResponse.json(await createUploadSlot(userId, body), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}