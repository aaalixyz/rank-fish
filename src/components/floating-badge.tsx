"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import type { Listing } from "@/db/schema";
import { progressToVw, type BadgeLook } from "@/lib/badge-look";
import { formatUsd, getLevelVisual } from "@/lib/bid-scale";
import { listingHref } from "@/lib/demo-data";
import { resolvePillTheme } from "@/lib/pill-themes";
import { cn } from "@/lib/utils";

type FloatingBadgeProps = {
  listing: Listing;
  look: BadgeLook;
  onLoop: () => void;
  demo?: boolean;
};

type PillVars = CSSProperties & {
  "--s": string;
  "--pill-bg": string;
  "--pill-fg": string;
  "--pill-outline": string;
  "--pill-rotate": string;
  "--pill-weight": string;
  "--pill-tracking": string;
  "--pill-opacity": string;
  "--bob": string;
  "--bob-duration": string;
  "--bob-delay": string;
};

/**
 * JS-driven L→R loop. X is written as translate3d so the start point is a
 * real coordinate (refresh = new XY). CSS keyframes + negative delay used
 * to pin every listing to the same hashed place on every load.
 */
export function FloatingBadge({
  listing,
  look,
  onLoop,
  demo = false,
}: FloatingBadgeProps) {
  const visual = getLevelVisual(listing.level);
  const theme = resolvePillTheme(listing.theme);
  const duration = visual.duration;
  const nodeRef = useRef<HTMLAnchorElement>(null);
  const lookRef = useRef(look);
  const durationRef = useRef(duration);
  const onLoopRef = useRef(onLoop);
  const [iconFailed, setIconFailed] = useState(false);
  const showIcon = Boolean(listing.faviconUrl) && !iconFailed;

  lookRef.current = look;
  durationRef.current = duration;
  onLoopRef.current = onLoop;

  useLayoutEffect(() => {
    const el = nodeRef.current;
    if (!el) return;

    let progress = lookRef.current.progress;
    let waiting = lookRef.current.enterDelay;

    const paint = () => {
      el.style.transform = `translate3d(${progressToVw(progress)}vw, 0, 0)`;
    };
    paint();

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduceMotion) return;

    let last = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const dt = Math.min(0.064, (now - last) / 1000);
      last = now;

      if (waiting > 0) {
        waiting -= dt;
      } else {
        progress += dt / durationRef.current;
        if (progress >= 1) {
          progress -= 1;
          onLoopRef.current();
        }
        paint();
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const pillStyle: PillVars = {
    "--s": visual.strength.toFixed(4),
    "--pill-bg": theme.bg,
    "--pill-fg": theme.fg,
    "--pill-outline": theme.outline,
    "--pill-rotate": `${look.rotateDeg.toFixed(2)}deg`,
    "--pill-weight": String(visual.weight),
    "--pill-tracking": `${visual.trackingEm.toFixed(4)}em`,
    "--pill-opacity": visual.opacity.toFixed(3),
    "--bob": `${look.bobEm.toFixed(3)}em`,
    "--bob-duration": `${look.bobDuration.toFixed(2)}s`,
    "--bob-delay": `-${(look.progress * look.bobDuration).toFixed(2)}s`,
  };

  return (
    <a
      ref={nodeRef}
      href={listingHref(listing, demo)}
      target="_blank"
      rel="noopener noreferrer"
      className="badge-drift group absolute left-0 will-change-transform"
      style={{
        top: `${look.lane * 100}%`,
        zIndex: Math.round(10 + visual.strength * 40),
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
