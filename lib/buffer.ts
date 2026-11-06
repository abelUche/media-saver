import { and, eq, isNull, lt, or } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { encrypt, decrypt } from '@/lib/crypto';
import { BUFFER_TOKEN_URL } from '@/lib/oauth';
import { ApiError } from '@/lib/errors';

const BUFFER_API_URL = 'https://api.buffer.com';
const REFRESH_MARGIN_MS = 5 * 60 * 1000;

export class BufferApiError extends ApiError {}

const LOCK_MS = 30 * 1000;
const WAIT_STEP_MS = 500;
const MAX_WAIT_MS = 10 * 1000;

function isFresh(expiresAt: Date) {
  return expiresAt.getTime() - Date.now() > REFRESH_MARGIN_MS;
}

async function loadUser(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) {
    throw new BufferApiError('User not found. Please log in again.', 401);
  }
  return user;
}

async function claimRefresh(userId: string) {
  const now = new Date();
  const claimed = await db
    .update(users)
    .set({ tokenRefreshLockedUntil: new Date(now.getTime() + LOCK_MS) })
    .where(
      and(
        eq(users.id, userId),
        or(isNull(users.tokenRefreshLockedUntil), lt(users.tokenRefreshLockedUntil, now)),
      ),
    )
    .returning({ id: users.id });
  return claimed.length > 0;
}

async function waitForOtherRefresh(userId: string) {
  const deadline = Date.now() + MAX_WAIT_MS;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, WAIT_STEP_MS));
    const user = await loadUser(userId);
    if (isFresh(user.tokenExpiresAt)) {
      return decrypt(user.accessToken);
    }
  }
  throw new BufferApiError('Your Buffer connection is being renewed. Try again in a few seconds.', 503);
}

export async function getAccessToken(userId: string): Promise<string> {
  const user = await loadUser(userId);
  if (isFresh(user.tokenExpiresAt)) {
    return decrypt(user.accessToken);
  }

  if (!(await claimRefresh(userId))) {
    return waitForOtherRefresh(userId);
  }

  try {
    // Another request may have finished refreshing between our first read and the claim.
    const current = await loadUser(userId);
    if (isFresh(current.tokenExpiresAt)) {
      return decrypt(current.accessToken);
    }

    const response = await fetch(BUFFER_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.BUFFER_CLIENT_ID!,
        client_secret: process.env.BUFFER_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: decrypt(current.refreshToken),
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
        refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : current.refreshToken,
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      })
      .where(eq(users.id, userId));

    return tokens.access_token;
  } finally {
    await db
      .update(users)
      .set({ tokenRefreshLockedUntil: null })
      .where(eq(users.id, userId))
      .catch((error) => console.error('Could not release the token refresh lock:', error));
  }
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
    console.error('Buffer error body:', await response.clone().text());
    throw new BufferApiError(`Buffer API returned ${response.status}`, 502);
  }

  const result = await response.json();
    if (result.errors?.length) {
    const message: string = result.errors[0].message ?? 'Buffer API error';
    const status = /not found/i.test(message) ? 404 : 502;
    throw new BufferApiError(message, status);
  }

  return result.data as T;
}