import Link from "next/link";
import { eq } from "drizzle-orm";
import { CheckCircle2, Clock3 } from "lucide-react";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { fulfillPaymentByCheckoutId } from "@/lib/fulfill-payment";
import { getPolarClient } from "@/lib/polar";

export const dynamic = "force-dynamic";

type SuccessPageProps = {
  searchParams: Promise<{ checkout_id?: string }>;
};

/**
 * After Polar checkout, users land here.
 * We double-check payment status and fulfill if the webhook is slightly late.
 */
export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const { checkout_id: checkoutId } = await searchParams;

  let status: "success" | "pending" | "missing" = "missing";
  let title = "Thanks";

  if (checkoutId) {
    try {
      // Ask Polar if this checkout actually succeeded
      const polar = getPolarClient();
      const checkout = await polar.checkouts.get({ id: checkoutId });

      if (checkout.status === "succeeded") {
        await fulfillPaymentByCheckoutId(checkoutId);
        status = "success";
        title = "You're on the board";
      } else {
        // Webhook may still arrive — check our local payment row
        const [payment] = await db
          .select()
          .from(payments)
          .where(eq(payments.polarCheckoutId, checkoutId))
          .limit(1);

        if (payment?.status === "completed") {
          status = "success";
          title = "You're on the board";
        } else {
          status = "pending";
          title = "Payment processing";
        }
      }
    } catch (error) {
      console.error("[success]", error);
      status = "pending";
      title = "Payment processing";
    }
  }

  return (
    <div className="dark flex min-h-screen flex-col items-center justify-center bg-[#05080c] px-4 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b1218] p-8 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-teal-400/10">
          {status === "success" ? (
            <CheckCircle2 className="size-6 text-teal-300" />
          ) : (
            <Clock3 className="size-6 text-teal-300/80" />
          )}
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl tracking-tight">
          {title}
        </h1>
        <p className="mt-2 text-sm text-white/50">
          {status === "success"
            ? "Your bid is live. Size and opacity update with your amount."
            : status === "pending"
              ? "Polar is confirming your payment. Refresh the home page in a few seconds."
              : "No checkout was found. Head home and try again."}
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-9 items-center justify-center rounded-lg bg-teal-300 px-4 text-sm font-medium text-[#041016] transition hover:bg-teal-200"
        >
          Back to rank.fish
        </Link>
      </div>
    </div>
  );
}
