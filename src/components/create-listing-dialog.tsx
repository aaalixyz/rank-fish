"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { dollarsToCents, formatUsd } from "@/lib/bid-scale";
import { MIN_BID_CENTS } from "@/lib/validations";

type CreateListingDialogProps = {
  /** Optional custom open button. If omitted, a default button is shown. */
  triggerClassName?: string;
  triggerLabel?: string;
  triggerSize?: "default" | "sm" | "lg";
};

export function CreateListingDialog({
  triggerClassName,
  triggerLabel = "Add listing",
  triggerSize = "default",
}: CreateListingDialogProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bidDollars, setBidDollars] = useState("5.00");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const bid = dollarsToCents(bidDollars);
    if (bid < MIN_BID_CENTS) {
      setError(`Minimum bid is ${formatUsd(MIN_BID_CENTS)}`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "create",
          url: url.trim(),
          title: title.trim(),
          description: description.trim(),
          bid,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not start payment");
      }

      // Send the user to Polar hosted checkout
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        size={triggerSize}
        className={
          triggerClassName ??
          "bg-teal-300 text-[#041016] hover:bg-teal-200"
        }
        onClick={() => setOpen(true)}
      >
        {triggerLabel}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-white/10 bg-[#0b1218] text-white sm:max-w-md">
          <form onSubmit={onSubmit}>
            <DialogHeader>
              <DialogTitle className="font-[family-name:var(--font-display)] text-xl">
                Cast a new badge
              </DialogTitle>
              <DialogDescription className="text-white/50">
                Pay once to appear on the field. Higher support = bigger, denser,
                slower drift.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  type="url"
                  required
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="border-white/10 bg-white/5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  required
                  maxLength={120}
                  placeholder="My project"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="border-white/10 bg-white/5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Short description</Label>
                <Textarea
                  id="description"
                  maxLength={280}
                  placeholder="One line about what this is"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-20 border-white/10 bg-white/5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bid">Bid (USD)</Label>
                <Input
                  id="bid"
                  type="number"
                  required
                  min={1}
                  step="0.01"
                  value={bidDollars}
                  onChange={(e) => setBidDollars(e.target.value)}
                  className="border-white/10 bg-white/5 font-mono"
                />
                <p className="text-xs text-white/40">
                  You pay this amount now. Minimum {formatUsd(MIN_BID_CENTS)}.
                </p>
              </div>

              {error && (
                <p className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-200">
                  {error}
                </p>
              )}
            </div>

            <DialogFooter className="mt-6 border-white/8 bg-transparent">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-300 text-[#041016] hover:bg-teal-200 sm:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Redirecting…
                  </>
                ) : (
                  `Pay ${formatUsd(dollarsToCents(bidDollars) || 0)} & appear`
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
