-- Submitter-picked pill color theme for field badges

ALTER TABLE "listings"
  ADD COLUMN IF NOT EXISTS "theme" varchar(32) DEFAULT 'paper' NOT NULL;

ALTER TABLE "payments"
  ADD COLUMN IF NOT EXISTS "theme" varchar(32) DEFAULT 'paper' NOT NULL;
