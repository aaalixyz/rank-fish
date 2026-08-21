"use client";

import { motion } from "framer-motion";
import type { Listing } from "@/db/schema";
import { formatUsd, getBidVisual } from "@/lib/bid-scale";
import { cn } from "@/lib/utils";

type FloatingBadgeProps = {
  listing: Listing;
  minBid: number;
  maxBid: number;
  /** Vertical lane 0–1 (top → bottom of field) */
  y: number;
  /** Used to stagger start offset and vary speed slightly */
  index: number;
};

/**
 * Deterministic pseudo-random in [0,1) so SSR and client match.
 */
function hashUnit(n: number) {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function FloatingBadge({
  listing,
  minBid,
  maxBid,
  y,
  index,
}: FloatingBadgeProps) {
  const visual = getBidVisual(listing.bid, minBid, maxBid);
  const phase = hashUnit(index + 1);
  const speedJitter = 0.85 + hashUnit(index + 17) * 0.35;
  const duration = visual.duration * speedJitter;
  // Start somewhere along the loop so badges don't all enter together
  const delay = -(phase * duration);

  return (
    <motion.a
      href={`/api/click?id=${listing.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group absolute left-0 will-change-transform"
      style={{
        top: `${y * 100}%`,
        width: visual.size,
        marginTop: -visual.size * 0.35,
        zIndex: Math.round(10 + visual.strength * 40),
        opacity: visual.opacity,
      }}
      initial={false}
      animate={{ x: ["-15vw", "115vw"] }}
      transition={{
        x: {
          duration,
          repeat: Infinity,
          ease: "linear",
          delay,
        },
      }}
      title={`${listing.title} — ${formatUsd(listing.bid)}`}
    >
      <span
        className={cn(
          "inline-flex max-w-full items-baseline gap-2 truncate border-b border-teal-300/20 pb-0.5 text-left transition group-hover:border-teal-300/55",
          visual.strength > 0.65
            ? "text-teal-50"
            : visual.strength > 0.35
              ? "text-white/80"
              : "text-white/55"
        )}
      >
        <span
          className={cn(
            "font-[family-name:var(--font-display)] font-semibold tracking-tight",
            visual.size < 100
              ? "text-sm"
              : visual.size < 150
                ? "text-lg"
                : visual.size < 190
                  ? "text-2xl"
                  : "text-3xl"
          )}
        >
          {listing.title}
        </span>
        <span
          className={cn(
            "shrink-0 font-mono tabular-nums text-teal-200/70",
            visual.size < 110 ? "text-[9px]" : "text-[11px]"
          )}
        >
          {formatUsd(listing.bid)}
        </span>
      </span>
    </motion.a>
  );
}
