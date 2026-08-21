import { z } from "zod";

/** Minimum bid for a brand-new listing ($1.00) */
export const MIN_BID_CENTS = 100;

const urlSchema = z
  .string()
  .trim()
  .url("Enter a valid URL (include https://)")
  .refine(
    (value) => value.startsWith("http://") || value.startsWith("https://"),
    "URL must start with http:// or https://"
  );

export const createListingSchema = z.object({
  type: z.literal("create"),
  url: urlSchema,
  title: z
    .string()
    .trim()
    .min(2, "Title is too short")
    .max(120, "Title is too long"),
  description: z
    .string()
    .trim()
    .max(280, "Description is too long")
    .default(""),
  // Bid in USD cents
  bid: z
    .number()
    .int()
    .min(MIN_BID_CENTS, "Minimum bid is $1.00"),
});

export const boostListingSchema = z.object({
  type: z.literal("boost"),
  listingId: z.string().uuid("Invalid listing"),
  // New total bid in USD cents (must be higher than current)
  bid: z.number().int().min(MIN_BID_CENTS, "Minimum bid is $1.00"),
});

export const checkoutRequestSchema = z.discriminatedUnion("type", [
  createListingSchema,
  boostListingSchema,
]);

export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;
