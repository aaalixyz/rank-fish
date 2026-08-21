"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import type { Listing } from "@/db/schema";
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
import {
  centsToDollarInput,
  dollarsToCents,
  formatUsd,
} from "@/lib/bid-scale";

type BoostDialogProps = {
  listing: Listing | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function BoostDialog({ listing, open, onOpenChange }: BoostDialogProps) {
  const [bidDollars, setBidDollars] = useState("");
  const [message, setMessage] = useState("Great work!");
  const [xHandle, setXHandle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (listing) {
      const suggested = listing.bid + 100;
      setBidDollars(centsToDollarInput(suggested));
      setMessage("Great work!");
      setXHandle("");
      setError(null);
      setLoading(false);
    }
  }, [listing]);

  const difference = useMemo(() => {
    if (!listing) return 0;
    const next = dollarsToCents(bidDollars);
    return Math.max(0, next - listing.bid);
  }, [bidDollars, listing]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!listing) return;

    setError(null);
    const bid = dollarsToCents(bidDollars);

    if (bid <= listing.bid) {
      setError(`Enter more than the current ${formatUsd(listing.bid)}`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "boost",
          listingId: listing.id,
          bid,
          message: message.trim(),
          xHandle: xHandle.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not start payment");
      }

      window.location.href = data.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-[#0b1218] text-white sm:max-w-md">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-display)] text-xl">
              Boost & support
            </DialogTitle>
            <DialogDescription className="text-white/50">
              {listing ? (
                <>
                  Raise <span className="text-white/80">{listing.title}</span>.
                  Leave a note for the creator — optionally your X handle.
                </>
              ) : (
                "Pick a listing to boost."
              )}
            </DialogDescription>
          </DialogHeader>

          {listing && (
            <div className="mt-4 space-y-4">
              <div className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm">
                <div className="flex justify-between text-white/50">
                  <span>Current bid</span>
                  <span className="font-mono text-white/80">
                    {formatUsd(listing.bid)}
                  </span>
                </div>
                <div className="mt-2 flex justify-between text-white/50">
                  <span>You pay now</span>
                  <span className="font-mono text-teal-200">
                    {formatUsd(difference)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="boost-bid">New total bid (USD)</Label>
                <Input
                  id="boost-bid"
                  type="number"
                  required
                  min={(listing.bid + 1) / 100}
                  step="0.01"
                  value={bidDollars}
                  onChange={(e) => setBidDollars(e.target.value)}
                  className="border-white/10 bg-white/5 font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="boost-message">Message</Label>
                <Textarea
                  id="boost-message"
                  maxLength={160}
                  placeholder="Great work!"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-20 border-white/10 bg-white/5"
                />
                <p className="text-xs text-white/35">
                  Shown on the rank page under this link. Optional.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="boost-x">X handle (optional)</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35">
                    @
                  </span>
                  <Input
                    id="boost-x"
                    maxLength={40}
                    placeholder="creator"
                    value={xHandle}
                    onChange={(e) => setXHandle(e.target.value)}
                    className="border-white/10 bg-white/5 pl-7"
                  />
                </div>
                <p className="text-xs text-white/35">
                  So the creator can find and thank you.
                </p>
              </div>

              {error && (
                <p className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-200">
                  {error}
                </p>
              )}
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button
              type="submit"
              disabled={loading || !listing || difference <= 0}
              className="w-full bg-teal-300 text-[#041016] hover:bg-teal-200 sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Redirecting…
                </>
              ) : (
                `Pay ${formatUsd(difference)} difference`
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
