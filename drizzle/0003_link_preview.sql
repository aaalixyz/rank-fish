-- Link preview dialog: separate visit count + cached Open Graph fields

ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "visits" integer DEFAULT 0 NOT NULL;
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "og_image_url" text DEFAULT '' NOT NULL;
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "og_description" varchar(280) DEFAULT '' NOT NULL;
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "og_fetched_at" timestamp with time zone;
