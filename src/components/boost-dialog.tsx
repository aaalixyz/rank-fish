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
import { LevelSlider } from "@/components/level-slider";
import { ThemePicker } from "@/components/theme-picker";
import { useDemoMode } from "@/components/demo-mode";
import { formatUsd } from "@/lib/bid-scale";
import {
  DEFAULT_PILL_THEME,
  isPillThemeId,
  type PillThemeId,
} from "@/lib/pill-themes";
import {
  buildEconomy,
  levelToCents,
  minBoostLevel,
  type EconomySnapshot,
} from "@/lib/pricing";

type BoostDialogProps = {
  listing: Listing | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  economy?: EconomySnapshot;
};

export function BoostDialog({
  listing,
  open,
  onOpenChange,
  economy: economyProp,
}: BoostDialogProps) {
  const demo = useDemoMode();
  const [economy, setEconomy] = useState<EconomySnapshot>(
    economyProp ?? buildEconomy(0, 0)
  );
  const [level, setLevel] = useState(10);
  const [theme, setTheme] = useState<PillThemeId>(DEFAULT_PILL_THEME);
  const [message, setMessage] = useState("Great work!");
  const [xHandle, setXHandle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (economyProp) setEconomy(economyProp);
  }, [economyProp]);

  useEffect(() => {
    if (!open || demo.active) return;
    let cancelled = false;
    fetch("/api/economy")
      .then((r) => r.json())
      .then((data: EconomySnapshot) => {
        if (!cancelled) setEconomy(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open, demo.active]);

  const floor = useMemo(() => {
    if (!listing) return 1;
    return minBoostLevel(listing.bid, economy.minCents, economy.maxCents);
  }, [listing, economy.minCents, economy.maxCents]);

  useEffect(() => {
    if (listing) {
      setLevel(floor);
      setTheme(
        listing.theme && isPillThemeId(listing.theme)
          ? listing.theme
          : DEFAULT_PILL_THEME
      );
      setMessage("Great work!");
      setXHandle("");
      setError(null);
      setLoading(false);
    }
  }, [listing, floor]);

  const targetBid = useMemo(
    () => levelToCents(level, economy.minCents, economy.maxCents),
    [level, economy.minCents, economy.maxCents]
  );

  const difference = listing ? Math.max(0, targetBid - listing.bid) : 0;
  const maxedOut = floor >= 100 && listing != null && targetBid <= listing.bid;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!listing) return;

    setError(null);
    if (demo.active) {
      setError("Demo board — checkout is off. Click the logo twice to leave.");
      return;
    }
    if (targetBid <= listing.bid) {
      setError(`Pick a higher level than the current ${formatUsd(listing.bid)}`);
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
          level,
          theme,
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
      <DialogContent className="max-h-[min(92dvh,44rem)] overflow-y-auto border-neutral-200 bg-white text-neutral-900 sm:max-w-md">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-display)] text-xl">
              Boost & support
            </DialogTitle>
            <DialogDescription className="text-neutral-500">
              {listing ? (
                <>
                  Raise <span className="text-neutral-800">{listing.title}</span>.
                  You only pay the difference — leave a note for the creator.
                </>
              ) : (
                "Pick a listing to boost."
              )}
            </DialogDescription>
          </DialogHeader>

          {listing && (
            <div className="mt-4 space-y-4">
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm">
                <div className="flex justify-between text-neutral-500">
                  <span>Current</span>
                  <span className="font-mono text-neutral-800">
                    Lv {listing.level} · {formatUsd(listing.bid)}
                  </span>
                </div>
                <div className="mt-2 flex justify-between text-neutral-500">
                  <span>You pay now</span>
                  <span className="font-mono text-neutral-900">
                    {formatUsd(difference)}
                  </span>
                </div>
              </div>

              {maxedOut ? (
                <p className="text-sm text-neutral-500">
                  This listing is already at the top of the current price band.
                  As more links and clicks land, the range expands and higher
                  boosts open up.
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-neutral-400">
                        New level
                      </p>
                      <p className="font-[family-name:var(--font-display)] text-2xl tabular-nums">
                        Lv {level}
                      </p>
                    </div>
                    <p className="font-mono text-lg tabular-nums">
                      {formatUsd(targetBid)}
                    </p>
                  </div>
                  <LevelSlider
                    id="boost-level"
                    value={level}
                    min={floor}
                    max={100}
                    onChange={setLevel}
                  />
                  <p className="text-xs text-neutral-500">
                    Tier {economy.tier} band · Lv {floor}–100. Boost anytime —
                    only the difference is charged.
                  </p>
                </div>
              )}

              <ThemePicker value={theme} onChange={setTheme} />

              <div className="space-y-2">
                <Label htmlFor="boost-message">Message</Label>
                <Textarea
                  id="boost-message"
                  maxLength={160}
                  placeholder="Great work!"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-20 border-neutral-200 bg-neutral-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="boost-x">X handle (optional)</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                    @
                  </span>
                  <Input
                    id="boost-x"
                    maxLength={40}
                    placeholder="you"
                    value={xHandle}
                    onChange={(e) => setXHandle(e.target.value)}
                    className="border-neutral-200 bg-neutral-50 pl-7"
                  />
                </div>
              </div>

              {error && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button
              type="submit"
              disabled={loading || !listing || difference <= 0 || maxedOut}
              className="w-full bg-neutral-900 text-white hover:bg-neutral-800 sm:w-auto"
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
