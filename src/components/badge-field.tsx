"use client";

import { useMemo } from "react";
import type { Listing } from "@/db/schema";
import { FloatingBadge } from "@/components/floating-badge";

type BadgeFieldProps = {
  listings: Listing[];
};

/**
 * Spread badges across vertical lanes with a deterministic layout
 * so server and client render the same positions (no hydration mismatch).
 */
function laneFor(index: number) {
  // Golden-ratio spacing keeps lanes from stacking on the same row
  const golden = 0.61803398875;
  const t = (index * golden) % 1;
  // Keep clear of the header band and bottom edge
  return 0.14 + t * 0.72;
}

export function BadgeField({ listings }: BadgeFieldProps) {
  const { minBid, maxBid } = useMemo(() => {
    if (listings.length === 0) return { minBid: 100, maxBid: 100 };
    const bids = listings.map((l) => l.bid);
    return {
      minBid: Math.min(...bids),
      maxBid: Math.max(...bids),
    };
  }, [listings]);

  return (
    <section className="relative h-[100dvh] w-screen overflow-hidden">
      {/* Atmosphere — deep water, not flat black */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(20,90,100,0.28),transparent_50%),radial-gradient(ellipse_at_85%_70%,rgba(14,55,70,0.2),transparent_42%),radial-gradient(ellipse_at_15%_85%,rgba(25,45,65,0.16),transparent_40%),linear-gradient(180deg,#05080c_0%,#081018_55%,#05070a_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.3]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Soft vignette so drifting text reads against edges */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(5,8,12,0.55)_0%,transparent_12%,transparent_88%,rgba(5,8,12,0.55)_100%),linear-gradient(180deg,rgba(5,8,12,0.5)_0%,transparent_12%,transparent_90%,rgba(5,8,12,0.35)_100%)]"
      />

      <div className="absolute inset-0">
        {listings.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6">
            <p className="max-w-sm text-center text-sm text-white/40">
              The field is empty. Add a link — it will drift across with size and
              weight matching your support.
            </p>
          </div>
        ) : (
          listings.map((listing, index) => (
            <FloatingBadge
              key={listing.id}
              listing={listing}
              minBid={minBid}
              maxBid={maxBid}
              y={laneFor(index)}
              index={index}
            />
          ))
        )}
      </div>
    </section>
  );
}
