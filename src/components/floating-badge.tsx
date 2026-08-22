"use client";

import { useState, type CSSProperties } from "react";
import type { Listing } from "@/db/schema";
import type { BadgeLook } from "@/lib/badge-look";
import { formatUsd, getLevelVisual } from "@/lib/bid-scale";
import { resolvePillTheme } from "@/lib/pill-themes";
import { cn } from "@/lib/utils";

type FloatingBadgeProps = {
  listing: Listing;
  look: BadgeLook;
};

type PillVars = CSSProperties & {
  "--s": string;
  "--pill-bg": string;
  "--pill-fg": string;
  "--pill-outline": string;
  "--pill-rotate": string;
  "--pill-scale": string;
  "--pill-weight": string;
  "--pill-tracking": string;
  "--pill-opacity": string;
  "--bob": string;
  "--bob-duration": string;
  "--bob-delay": string;
};

/**
 * CSS-driven L→R loop. Placement (lane + phase) comes from layoutField so
 * badges are spread across the canvas instead of hashing into the same band.
 */
export function FloatingBadge({ listing, look }: FloatingBadgeProps) {
  const visual = getLevelVisual(listing.level);
  const theme = resolvePillTheme(listing.theme);
  const duration = visual.duration * look.speedJitter;
  const [iconFailed, setIconFailed] = useState(false);
  const showIcon = Boolean(listing.faviconUrl) && !iconFailed;

  const pillStyle: PillVars = {
    "--s": visual.strength.toFixed(4),
    "--pill-bg": theme.bg,
    "--pill-fg": theme.fg,
    "--pill-outline": theme.outline,
    "--pill-rotate": `${look.rotateDeg.toFixed(2)}deg`,
    "--pill-scale": look.scale.toFixed(3),
    "--pill-weight": String(look.weight),
    "--pill-tracking": `${look.trackingEm.toFixed(4)}em`,
    "--pill-opacity": visual.opacity.toFixed(3),
    "--bob": `${look.bobEm.toFixed(3)}em`,
    "--bob-duration": `${look.bobDuration.toFixed(2)}s`,
    "--bob-delay": `-${(look.phase * look.bobDuration).toFixed(2)}s`,
  };

  return (
    <a
      href={`/api/click?id=${listing.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="badge-drift group absolute left-0 will-change-transform"
      style={{
        top: `${look.lane * 100}%`,
        zIndex: Math.round(10 + visual.strength * 40),
        animationDuration: `${duration}s`,
        animationDelay: `-${look.phase * duration}s`,
      }}
      title={`${listing.title} — Lv ${listing.level} · ${formatUsd(listing.bid)} · ${theme.label}`}
    >
      <span
        className={cn(
          "pill-mark",
          visual.strength < 0.2 && "pill-mark--quiet"
        )}
        style={pillStyle}
      >
        {showIcon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.faviconUrl}
            alt=""
            className="pill-mark__icon"
            onError={() => setIconFailed(true)}
          />
        ) : null}
        <span className="pill-mark__title">{listing.title}</span>
      </span>
    </a>
  );
}
