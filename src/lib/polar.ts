/**
 * Polar.sh client helpers
 *
 * Polar is the Merchant of Record — they handle taxes, invoices, and payouts.
 * We create a checkout with a custom (ad-hoc) price equal to what the user owes,
 * then the webhook tells us when payment succeeded.
 */
import { Polar } from "@polar-sh/sdk";

export function getPolarServer(): "sandbox" | "production" {
  return process.env.POLAR_SERVER === "sandbox" ? "sandbox" : "production";
}

export function getPolarClient() {
  const accessToken = process.env.POLAR_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error(
      "POLAR_ACCESS_TOKEN is missing. Add it to your environment variables (see README)."
    );
  }

  return new Polar({
    accessToken,
    server: getPolarServer(),
  });
}

export function getAppUrl() {
  const url =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL;

  if (!url) {
    return "http://localhost:3000";
  }

  return url.startsWith("http") ? url : `https://${url}`;
}

export type CheckoutMetadata = {
  paymentId: string;
  type: "create" | "boost";
  listingId?: string;
  targetBid: string;
};

/**
 * Create a Polar checkout session with a one-time custom dollar amount.
 *
 * You need one one-time product in your Polar dashboard (POLAR_PRODUCT_ID).
 * We override its price per checkout so users can pay any bid amount.
 */
export async function createPolarCheckout(options: {
  amountCents: number;
  metadata: CheckoutMetadata;
  productNameHint?: string;
}) {
  const productId = process.env.POLAR_PRODUCT_ID;

  if (!productId) {
    throw new Error(
      "POLAR_PRODUCT_ID is missing. Create a one-time product in Polar and paste its ID (see README)."
    );
  }

  if (options.amountCents < 100) {
    throw new Error("Amount must be at least $1.00");
  }

  const polar = getPolarClient();
  const appUrl = getAppUrl();

  const checkout = await polar.checkouts.create({
    products: [productId],
    // Ad-hoc price: charge exactly this amount for this checkout only
    prices: {
      [productId]: [
        {
          amountType: "fixed",
          priceAmount: options.amountCents,
          priceCurrency: "usd",
        },
      ],
    },
    successUrl: `${appUrl}/success?checkout_id={CHECKOUT_ID}`,
    metadata: {
      paymentId: options.metadata.paymentId,
      type: options.metadata.type,
      targetBid: options.metadata.targetBid,
      ...(options.metadata.listingId
        ? { listingId: options.metadata.listingId }
        : {}),
      ...(options.productNameHint
        ? { hint: options.productNameHint.slice(0, 40) }
        : {}),
    },
  });

  if (!checkout.url) {
    throw new Error("Polar did not return a checkout URL");
  }

  return checkout;
}
