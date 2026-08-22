import { z } from "zod";
import { DEFAULT_PILL_THEME, PILL_THEME_IDS } from "@/lib/pill-themes";
import { MAX_LEVEL, MIN_LEVEL } from "@/lib/pricing";

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

const urlSchema = z
  .string()
  .trim()
  .url("Enter a valid URL (include https://)")
  .refine(
    (value) => value.startsWith("http://") || value.startsWith("https://"),
    "URL must start with http:// or https://"
  );

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

const levelSchema = z
  .number()
  .int()
  .min(MIN_LEVEL, `Level must be at least ${MIN_LEVEL}`)
  .max(MAX_LEVEL, `Level must be at most ${MAX_LEVEL}`);

const themeSchema = z.enum(PILL_THEME_IDS).default(DEFAULT_PILL_THEME);

export const createListingSchema = z.object({
  type: z.literal("create"),
  url: urlSchema,
  title: z
    .string()
    .trim()
    .min(2, "Title is too short")
    .max(120, "Title is too long"),
  level: levelSchema,
  theme: themeSchema,
  xHandle: xHandleSchema.default(""),
});

export const boostListingSchema = z.object({
  type: z.literal("boost"),
  listingId: z.string().uuid("Invalid listing"),
  level: levelSchema,
  message: messageSchema,
  xHandle: xHandleSchema.default(""),
  theme: themeSchema,
});

export const checkoutRequestSchema = z.discriminatedUnion("type", [
  createListingSchema,
  boostListingSchema,
]);

export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;
