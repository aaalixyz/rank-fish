/**
 * Database tables for rank.fish
 *
 * listings       → every paid badge on the site (ranked by bid)
 * payments       → tracks Polar checkouts so webhooks can finish the job safely
 * boost_messages → optional notes + X handles left when someone boosts
 */
import {
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const listings = pgTable("listings", {
  id: uuid("id").defaultRandom().primaryKey(),
  // The destination URL people visit when they click a badge
  url: text("url").notNull(),
  title: varchar("title", { length: 120 }).notNull(),
  description: varchar("description", { length: 280 }).notNull().default(""),
  // Resolved favicon URL — empty string means show no icon
  faviconUrl: text("favicon_url").notNull().default(""),
  // Bid amount stored in USD cents (e.g. $12.50 → 1250)
  bid: integer("bid").notNull().default(0),
  // Level 1–100 at time of last paid placement / boost
  level: integer("level").notNull().default(1),
  clicks: integer("clicks").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  // Polar checkout session id — used to match the webhook
  polarCheckoutId: text("polar_checkout_id").notNull().unique(),
  // "create" = brand new listing, "boost" = raise an existing bid
  type: varchar("type", { length: 20 }).notNull(),
  listingId: uuid("listing_id").references(() => listings.id),
  url: text("url").notNull(),
  title: varchar("title", { length: 120 }).notNull(),
  description: varchar("description", { length: 280 }).notNull().default(""),
  faviconUrl: text("favicon_url").notNull().default(""),
  level: integer("level").notNull().default(1),
  // Final bid the listing should have after this payment succeeds
  targetBid: integer("target_bid").notNull(),
  // How much the user is paying right now (full amount or just the difference)
  amountPaid: integer("amount_paid").notNull(),
  // Optional support note left with a boost
  message: varchar("message", { length: 160 }).notNull().default(""),
  // Optional X / Twitter handle (without @)
  xHandle: varchar("x_handle", { length: 40 }).notNull().default(""),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const boostMessages = pgTable("boost_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  listingId: uuid("listing_id")
    .notNull()
    .references(() => listings.id),
  paymentId: uuid("payment_id").references(() => payments.id),
  message: varchar("message", { length: 160 }).notNull(),
  xHandle: varchar("x_handle", { length: 40 }).notNull().default(""),
  amountPaid: integer("amount_paid").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Listing = typeof listings.$inferSelect;
export type NewListing = typeof listings.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type BoostMessage = typeof boostMessages.$inferSelect;
