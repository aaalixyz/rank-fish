"use client";

import { motion } from "framer-motion";
import type { Listing } from "@/db/schema";
import { formatUsd, getBidVisual } from "@/lib/bid-scale";
import { cn } from "@/lib/utils";

type FloatingBadgeProps = {
  listing: Listing;
  minBid: number;
  maxBid: number;
  /** Deterministic layout position 0–1 */
  x: number;
  y: number;
  /** Used to stagger float animation */
  index: number;
  onBoost: (listing: Listing) => void;
};

function initials(title: string) {
  const parts = title.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export function FloatingBadge({
  listing,
  minBid,
  maxBid,
  x,
  y,
  index,
  onBoost,
}: FloatingBadgeProps) {
  const visual = getBidVisual(listing.bid, minBid, maxBid);
  const duration = 5.5 + (index % 5) * 0.7;
  const drift = 8 + visual.strength * 10;

  return (
    <motion.div
      className="group absolute"
      style={{
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        width: visual.size,
        height: visual.size,
        marginLeft: -visual.size / 2,
        marginTop: -visual.size / 2,
        zIndex: Math.round(10 + visual.strength * 40),
      }}
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{
        opacity: visual.opacity,
        scale: 1,
        y: [0, -drift, 0, drift * 0.6, 0],
        x: [0, drift * 0.35, 0, -drift * 0.25, 0],
      }}
      transition={{
        opacity: { duration: 0.6, delay: index * 0.04 },
        scale: { type: "spring", stiffness: 180, damping: 18, delay: index * 0.04 },
        y: { duration, repeat: Infinity, ease: "easeInOut", delay: index * 0.15 },
        x: {
          duration: duration * 1.15,
          repeat: Infinity,
          ease: "easeInOut",
          delay: index * 0.2,
        },
      }}
      whileHover={{ scale: 1.08, opacity: Math.min(1, visual.opacity + 0.15) }}
    >
      <a
        href={`/api/click?id=${listing.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="relative flex size-full flex-col items-center justify-center rounded-full border border-teal-300/25 bg-[radial-gradient(circle_at_30%_25%,rgba(94,234,212,0.35),rgba(8,20,28,0.85)_55%,rgba(4,10,14,0.95))] text-center shadow-[0_0_0_1px_rgba(45,212,191,0.08),0_12px_40px_rgba(0,0,0,0.45)] outline-none transition focus-visible:ring-2 focus-visible:ring-teal-300/60"
        title={`${listing.title} — ${formatUsd(listing.bid)}`}
        onContextMenu={(e) => {
          e.preventDefault();
          onBoost(listing);
        }}
      >
        <span
          className={cn(
            "font-[family-name:var(--font-display)] font-semibold tracking-tight text-teal-50",
            visual.size < 80 ? "text-sm" : visual.size < 120 ? "text-base" : "text-lg"
          )}
        >
          {initials(listing.title)}
        </span>
        <span
          className={cn(
            "mt-0.5 max-w-[85%] truncate px-1 font-mono text-teal-100/80",
            visual.size < 90 ? "text-[9px]" : "text-[10px]"
          )}
        >
          {formatUsd(listing.bid)}
        </span>

        {/* Soft inner glow that grows with bid strength */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            boxShadow: `inset 0 0 ${20 + visual.strength * 40}px rgba(45,212,191,${0.08 + visual.strength * 0.18})`,
          }}
        />
      </a>

      <button
        type="button"
        onClick={() => onBoost(listing)}
        className="absolute -bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-full border border-white/10 bg-[#0c141c]/95 px-2 py-0.5 text-[10px] text-teal-100/80 opacity-0 backdrop-blur transition group-hover:opacity-100 hover:bg-teal-400/15 hover:text-teal-50 focus:opacity-100"
      >
        Boost
      </button>
    </motion.div>
  );
}
