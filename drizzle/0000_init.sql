-- rank.fish initial schema
-- Paste this into the Neon SQL Editor if you prefer not to use `npm run db:push`

CREATE TABLE IF NOT EXISTS "listings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "url" text NOT NULL,
  "title" varchar(120) NOT NULL,
  "description" varchar(280) DEFAULT '' NOT NULL,
  "bid" integer DEFAULT 0 NOT NULL,
  "clicks" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "payments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "polar_checkout_id" text NOT NULL,
  "type" varchar(20) NOT NULL,
  "listing_id" uuid,
  "url" text NOT NULL,
  "title" varchar(120) NOT NULL,
  "description" varchar(280) DEFAULT '' NOT NULL,
  "target_bid" integer NOT NULL,
  "amount_paid" integer NOT NULL,
  "status" varchar(20) DEFAULT 'pending' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "payments_polar_checkout_id_unique" UNIQUE("polar_checkout_id"),
  CONSTRAINT "payments_listing_id_listings_id_fk"
    FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id")
    ON DELETE no action ON UPDATE no action
);

CREATE INDEX IF NOT EXISTS "listings_bid_idx" ON "listings" ("bid" DESC);
