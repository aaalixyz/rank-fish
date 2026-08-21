"use client";

import { useState } from "react";
import type { Listing } from "@/db/schema";
import { formatUsd, getBidVisual } from "@/lib/bid-scale";
import { cn } from "@/lib/utils";

type FloatingBadgeProps = {
  listing: Listing;
  minBid: number;
  maxBid: number;
  y: number;
  index: number;
};

function hashUnit(n: number) {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * CSS-driven L→R loop. Framer keyframes were painting at translateX(114vw)
 * (off-screen) after hydration — native animation + negative delay is reliable.
 */
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
  const [iconFailed, setIconFailed] = useState(false);
  const showIcon = Boolean(listing.faviconUrl) && !iconFailed;
  const iconSize = Math.max(14, Math.round(visual.size * 0.14));

  return (
    <a
      href={`/api/click?id=${listing.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="badge-drift group absolute left-0 will-change-transform"
      style={{
        top: `${y * 100}%`,
        width: visual.size * 1.6,
        marginTop: -visual.size * 0.2,
        zIndex: Math.round(10 + visual.strength * 40),
        opacity: visual.opacity,
        animationDuration: `${duration}s`,
        animationDelay: `-${phase * duration}s`,
      }}
      title={`${listing.title} — Lv ${listing.level} · ${formatUsd(listing.bid)}`}
    >
      <span
        className={cn(
          "inline-flex max-w-full items-center gap-2 truncate text-left transition",
          visual.strength > 0.65
            ? "text-neutral-900"
            : visual.strength > 0.35
              ? "text-neutral-700"
              : "text-neutral-400"
        )}
      >
        {showIcon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.faviconUrl}
            alt=""
            width={iconSize}
            height={iconSize}
            className="shrink-0 rounded-sm"
            style={{ width: iconSize, height: iconSize }}
            onError={() => setIconFailed(true)}
          />
        ) : null}
        <span
          className={cn(
            "truncate font-[family-name:var(--font-display)] font-semibold tracking-tight",
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
      </span>
    </a>
  );
}
