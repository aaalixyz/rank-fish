-- Add optional boost message + X handle, and a messages table for the rank page

ALTER TABLE "payments"
  ADD COLUMN IF NOT EXISTS "message" varchar(160) DEFAULT '' NOT NULL;

ALTER TABLE "payments"
  ADD COLUMN IF NOT EXISTS "x_handle" varchar(40) DEFAULT '' NOT NULL;

CREATE TABLE IF NOT EXISTS "boost_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "listing_id" uuid NOT NULL,
  "payment_id" uuid,
  "message" varchar(160) NOT NULL,
  "x_handle" varchar(40) DEFAULT '' NOT NULL,
  "amount_paid" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "boost_messages_listing_id_listings_id_fk"
    FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id")
    ON DELETE no action ON UPDATE no action,
  CONSTRAINT "boost_messages_payment_id_payments_id_fk"
    FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id")
    ON DELETE no action ON UPDATE no action
);

CREATE INDEX IF NOT EXISTS "boost_messages_listing_id_idx"
  ON "boost_messages" ("listing_id");
