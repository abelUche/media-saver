import { NextRequest } from 'next/server';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { apiKeys } from '@/lib/db/schema';
import { getSession } from '@/lib/session';
import { hashApiKey } from '@/lib/api-keys';

export async function getAuthenticatedUserId(request: NextRequest): Promise<string | null> {
  const header = request.headers.get('authorization');

  if (header) {
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match) return null;

    const [apiKey] = await db
      .select({ id: apiKeys.id, userId: apiKeys.userId })
      .from(apiKeys)
      .where(and(eq(apiKeys.keyHash, hashApiKey(match[1].trim())), isNull(apiKeys.revokedAt)));

    if (!apiKey) return null;

    await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, apiKey.id));
    return apiKey.userId;
  }

  const session = await getSession();
  return session.userId ?? null;
}