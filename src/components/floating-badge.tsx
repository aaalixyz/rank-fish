"use client";

import { useState, type CSSProperties } from "react";
import type { Listing } from "@/db/schema";
import { getBadgeLook } from "@/lib/badge-look";
import { formatUsd, getLevelVisual } from "@/lib/bid-scale";
import { resolvePillTheme } from "@/lib/pill-themes";
import { cn } from "@/lib/utils";

type FloatingBadgeProps = {
  listing: Listing;
};

/**
 * CSS-driven L→R loop. Framer keyframes were painting at translateX(114vw)
 * (off-screen) after hydration — native animation + negative delay is reliable.
 */
export function FloatingBadge({ listing }: FloatingBadgeProps) {
  const visual = getLevelVisual(listing.level);
  const look = getBadgeLook(listing.id);
  const theme = resolvePillTheme(listing.theme);
  const duration = visual.duration * look.speedJitter;
  const [iconFailed, setIconFailed] = useState(false);
  const showIcon = Boolean(listing.faviconUrl) && !iconFailed;

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
        style={
          {
            "--s": visual.strength,
            "--pill-bg": theme.bg,
            "--pill-fg": theme.fg,
            "--pill-outline": theme.outline,
            "--pill-rotate": `${look.rotateDeg}deg`,
            "--pill-scale": look.scale,
            "--pill-weight": look.weight,
            "--pill-tracking": `${look.trackingEm}em`,
            "--pill-opacity": visual.opacity,
            "--bob": `${look.bobPx}px`,
            "--bob-duration": `${look.bobDuration}s`,
            "--bob-delay": `-${look.phase * look.bobDuration}s`,
          } as CSSProperties
        }
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
