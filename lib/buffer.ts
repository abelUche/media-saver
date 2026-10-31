import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { encrypt, decrypt } from '@/lib/crypto';
import { BUFFER_TOKEN_URL } from '@/lib/oauth';

const BUFFER_API_URL = 'https://api.buffer.com';
const REFRESH_MARGIN_MS = 5 * 60 * 1000;

export class BufferApiError extends Error {
  status: number;
  retryAfter?: number;

  constructor(message: string, status: number, retryAfter?: number) {
    super(message);
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

export async function getAccessToken(userId: string): Promise<string> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) {
    throw new BufferApiError('User not found. Please log in again.', 401);
  }

  if (user.tokenExpiresAt.getTime() - Date.now() > REFRESH_MARGIN_MS) {
    return decrypt(user.accessToken);
  }

  const response = await fetch(BUFFER_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.BUFFER_CLIENT_ID!,
      client_secret: process.env.BUFFER_CLIENT_SECRET!,
      grant_type: 'refresh_token',
      refresh_token: decrypt(user.refreshToken),
    }),
  });

  if (!response.ok) {
    console.error('Token refresh failed:', await response.text());
    throw new BufferApiError('Buffer connection expired. Please log in again.', 401);
  }

  const tokens = await response.json();

  await db
    .update(users)
    .set({
      accessToken: encrypt(tokens.access_token),
      refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : user.refreshToken,
      tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    })
    .where(eq(users.id, userId));

  return tokens.access_token;
}

export async function bufferRequest<T>(
  accessToken: string,
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const response = await fetch(BUFFER_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (response.status === 429) {
    const retryAfter = Number(response.headers.get('Retry-After')) || 60;
    throw new BufferApiError('Buffer rate limit reached. Try again later.', 429, retryAfter);
  }
  if (response.status === 401) {
    throw new BufferApiError('Buffer connection expired. Please log in again.', 401);
  }
  if (!response.ok) {
    throw new BufferApiError(`Buffer API returned ${response.status}`, 502);
  }

  const result = await response.json();
  if (result.errors?.length) {
    throw new BufferApiError(result.errors[0].message, 502);
  }

  return result.data as T;
}