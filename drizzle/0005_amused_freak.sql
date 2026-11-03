CREATE TYPE "public"."post_status" AS ENUM('scheduled', 'sent', 'failed', 'removed');--> statement-breakpoint
CREATE TABLE "upload_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"upload_id" uuid NOT NULL,
	"channel_id" text NOT NULL,
	"buffer_post_id" text NOT NULL,
	"status" "post_status" DEFAULT 'scheduled' NOT NULL,
	"due_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "upload_posts_buffer_post_id_unique" UNIQUE("buffer_post_id")
);
--> statement-breakpoint
ALTER TABLE "upload_posts" ADD CONSTRAINT "upload_posts_upload_id_uploads_id_fk" FOREIGN KEY ("upload_id") REFERENCES "public"."uploads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "upload_posts_upload_idx" ON "upload_posts" USING btree ("upload_id");