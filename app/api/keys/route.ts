import { NextRequest, NextResponse } from 'next/server';
import { and, count, desc, eq, isNull } from 'drizzle-orm';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { apiKeys } from '@/lib/db/schema';
import { generateApiKey } from '@/lib/api-keys';

const MAX_ACTIVE_KEYS = 10;

export async function GET() {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
  }

  const keys = await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      createdAt: apiKeys.createdAt,
      lastUsedAt: apiKeys.lastUsedAt,
    })
    .from(apiKeys)
    .where(and(eq(apiKeys.userId, session.userId), isNull(apiKeys.revokedAt)))
    .orderBy(desc(apiKeys.createdAt));

  return NextResponse.json({ keys });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  if (!name || name.length > 50) {
    return NextResponse.json({ error: 'Name must be 1 to 50 characters' }, { status: 400 });
  }

  const [{ value: activeCount }] = await db
    .select({ value: count() })
    .from(apiKeys)
    .where(and(eq(apiKeys.userId, session.userId), isNull(apiKeys.revokedAt)));

  if (activeCount >= MAX_ACTIVE_KEYS) {
    return NextResponse.json(
      { error: `You can have up to ${MAX_ACTIVE_KEYS} active keys. Revoke one first.` },
      { status: 400 },
    );
  }

  const { key, hash, prefix } = generateApiKey();

  const [created] = await db
    .insert(apiKeys)
    .values({ userId: session.userId, name, keyHash: hash, keyPrefix: prefix })
    .returning({ id: apiKeys.id, createdAt: apiKeys.createdAt });

  return NextResponse.json(
    { id: created.id, name, key, keyPrefix: prefix, createdAt: created.createdAt },
    { status: 201 },
  );
}