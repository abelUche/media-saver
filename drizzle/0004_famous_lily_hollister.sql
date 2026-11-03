ALTER TABLE "users" ADD COLUMN "channels_cache" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "channels_cached_at" timestamp with time zone;