-- Optional submitter X handle on new listings

ALTER TABLE "listings"
  ADD COLUMN IF NOT EXISTS "x_handle" varchar(40) DEFAULT '' NOT NULL;
