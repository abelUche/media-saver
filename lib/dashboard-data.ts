import { and, desc, eq, inArray, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { apiKeys, uploads, uploadPosts } from '@/lib/db/schema';

export async function getRecentUploads(userId: string) {
  return db
    .select()
    .from(uploads)
    .where(eq(uploads.userId, userId))
    .orderBy(desc(uploads.createdAt))
    .limit(25);
}

export async function getActiveKeys(userId: string) {
  return db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      createdAt: apiKeys.createdAt,
      lastUsedAt: apiKeys.lastUsedAt,
    })
    .from(apiKeys)
    .where(and(eq(apiKeys.userId, userId), isNull(apiKeys.revokedAt)))
    .orderBy(desc(apiKeys.createdAt));
}

export async function getUploadChannels(uploadIds: string[]) {
  if (uploadIds.length === 0) return {};
  const rows = await db
    .select({ uploadId: uploadPosts.uploadId, channelId: uploadPosts.channelId })
    .from(uploadPosts)
    .where(inArray(uploadPosts.uploadId, uploadIds));

  const byUpload: Record<string, string[]> = {};
  for (const row of rows) {
    (byUpload[row.uploadId] ??= []).push(row.channelId);
  }
  return byUpload;
}
