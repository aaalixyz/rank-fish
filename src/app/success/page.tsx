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

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const { checkout_id: checkoutId } = await searchParams;

  let status: "success" | "pending" | "missing" = "missing";
  let title = "Thanks";

  if (checkoutId) {
    try {
      const polar = getPolarClient();
      const checkout = await polar.checkouts.get({ id: checkoutId });

      if (checkout.status === "succeeded") {
        await fulfillPaymentByCheckoutId(checkoutId);
        status = "success";
        title = "You're on the board";
      } else {
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f7f6f3] px-4 text-neutral-900">
      <div className="w-full max-w-md border border-neutral-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-neutral-100">
          {status === "success" ? (
            <CheckCircle2 className="size-6 text-neutral-800" />
          ) : (
            <Clock3 className="size-6 text-neutral-500" />
          )}
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl tracking-tight">
          {title}
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          {status === "success"
            ? "Your support is live. Check the field for drift size, or Rank for messages."
            : status === "pending"
              ? "Polar is confirming your payment. Refresh the field in a few seconds."
              : "No checkout was found. Head home and try again."}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-neutral-900 px-4 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            Field
          </Link>
          <Link
            href="/rank"
            className="inline-flex h-9 items-center justify-center rounded-lg border border-neutral-200 px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
          >
            Rank
          </Link>
        </div>
      </div>
    </div>
  );
}
