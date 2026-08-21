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

/** Strip @ and urls; keep a clean handle or empty */
export function normalizeXHandle(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const withoutAt = trimmed.replace(/^@+/, "");
  const fromUrl = withoutAt
    .replace(/^https?:\/\/(www\.)?(twitter|x)\.com\//i, "")
    .split(/[/?#]/)[0];
  return fromUrl.slice(0, 40);
}

const xHandleSchema = z
  .string()
  .trim()
  .max(40, "X handle is too long")
  .transform(normalizeXHandle)
  .refine(
    (value) => value === "" || /^[A-Za-z0-9_]{1,40}$/.test(value),
    "Enter a valid X handle"
  );

const messageSchema = z
  .string()
  .trim()
  .max(160, "Message is too long")
  .default("");

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
  message: messageSchema,
  xHandle: xHandleSchema.default(""),
});

export const checkoutRequestSchema = z.discriminatedUnion("type", [
  createListingSchema,
  boostListingSchema,
]);

export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;
