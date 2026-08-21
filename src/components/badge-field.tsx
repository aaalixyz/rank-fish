"use client";

import { useMemo, useState } from "react";
import type { Listing } from "@/db/schema";
import { FloatingBadge } from "@/components/floating-badge";
import { BoostDialog } from "@/components/boost-dialog";

type BadgeFieldProps = {
  listings: Listing[];
};

/**
 * Spread badges across the field with a deterministic “organic” layout
 * so server and client render the same positions (no hydration mismatch).
 */
function positionFor(index: number, total: number) {
  // Golden-angle spiral keeps badges from stacking in the center
  const golden = Math.PI * (3 - Math.sqrt(5));
  const t = total <= 1 ? 0.5 : index / Math.max(total - 1, 1);
  const radius = 0.12 + t * 0.34;
  const angle = index * golden;

  const x = 0.5 + Math.cos(angle) * radius * 1.35;
  const y = 0.48 + Math.sin(angle) * radius * 0.95;

  return {
    x: Math.min(0.9, Math.max(0.1, x)),
    y: Math.min(0.88, Math.max(0.14, y)),
  };
}

export function BadgeField({ listings }: BadgeFieldProps) {
  const [boostTarget, setBoostTarget] = useState<Listing | null>(null);

  const { minBid, maxBid } = useMemo(() => {
    if (listings.length === 0) return { minBid: 100, maxBid: 100 };
    const bids = listings.map((l) => l.bid);
    return {
      minBid: Math.min(...bids),
      maxBid: Math.max(...bids),
    };
  }, [listings]);

  return (
    <section className="relative min-h-[70vh] overflow-hidden sm:min-h-[78vh]">
      {/* Atmospheric background — deep ocean, not flat black */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(20,80,90,0.35),transparent_55%),radial-gradient(ellipse_at_80%_70%,rgba(14,60,70,0.22),transparent_45%),radial-gradient(ellipse_at_20%_80%,rgba(30,50,70,0.18),transparent_40%),linear-gradient(180deg,#05080c_0%,#081018_50%,#05070a_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-4 pb-24 pt-10 sm:px-6 sm:pt-14">
        <div className="mb-8 max-w-xl text-center">
          <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-white sm:text-4xl">
            The field
          </h2>
          <p className="mt-2 text-sm text-white/45 sm:text-base">
            Pay more, float bigger. Opacity and size follow your bid.
          </p>
        </div>

        <div className="relative h-[520px] w-full sm:h-[620px]">
          {listings.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="max-w-sm text-center text-sm text-white/40">
                The water is calm. Add a link to cast the first badge.
              </p>
            </div>
          ) : (
            listings.map((listing, index) => {
              const { x, y } = positionFor(index, listings.length);
              return (
                <FloatingBadge
                  key={listing.id}
                  listing={listing}
                  minBid={minBid}
                  maxBid={maxBid}
                  x={x}
                  y={y}
                  index={index}
                  onBoost={setBoostTarget}
                />
              );
            })
          )}
        </div>
      </div>

      <BoostDialog
        listing={boostTarget}
        open={!!boostTarget}
        onOpenChange={(open) => {
          if (!open) setBoostTarget(null);
        }}
      />
    </section>
  );
}
