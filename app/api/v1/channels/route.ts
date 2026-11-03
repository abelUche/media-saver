import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId } from '@/lib/auth';
import { getChannels } from '@/lib/channels';
import { ApiError, errorResponse } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      throw new ApiError('Not logged in or invalid API key', 401);
    }
    return NextResponse.json({ channels: await getChannels(userId) });
  } catch (error) {
    return errorResponse(error);
  }
}