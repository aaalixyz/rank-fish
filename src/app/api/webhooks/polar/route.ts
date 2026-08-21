/**
 * Polar webhook endpoint
 *
 * Polar calls this URL after payment events.
 * We listen for order.paid (and checkout.updated as a backup)
 * and then create / boost the listing in the database.
 *
 * Register this URL in Polar → Settings → Webhooks:
 *   https://YOUR_DOMAIN/api/webhooks/polar
 */
import { Webhooks } from "@polar-sh/nextjs";
import { fulfillPaymentByCheckoutId } from "@/lib/fulfill-payment";

export const runtime = "nodejs";

async function handlePaidCheckout(checkoutId: string | null | undefined) {
  if (!checkoutId) {
    console.warn("[polar webhook] Missing checkout id");
    return;
  }

  const result = await fulfillPaymentByCheckoutId(checkoutId);
  console.log("[polar webhook] fulfill result", checkoutId, result);
}

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  onOrderPaid: async (payload) => {
    // One-time purchase completed — this is the primary signal we care about
    const checkoutId = payload.data.checkoutId;
    await handlePaidCheckout(checkoutId);
  },
  onCheckoutUpdated: async (payload) => {
    // Backup path: some setups only emit checkout.updated with status succeeded
    if (payload.data.status === "succeeded") {
      await handlePaidCheckout(payload.data.id);
    }
  },
});
