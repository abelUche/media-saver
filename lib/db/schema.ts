import { pgTable, pgEnum, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';

export const uploadStatus = pgEnum('upload_status', [
  'pending',
  'scheduled',
  'published',
  'deleted',
  'failed',
]);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  bufferAccountId: text('buffer_account_id').notNull().unique(),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token').notNull(),
  tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const uploads = pgTable(
  'uploads',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id),
    r2Key: text('r2_key').notNull().unique(),
    publicUrl: text('public_url').notNull(),
    bufferPostId: text('buffer_post_id'),
    status: uploadStatus('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [index('uploads_status_idx').on(table.status)],
);