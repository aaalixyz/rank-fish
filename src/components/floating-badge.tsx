"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
} from "react";
import type { Listing } from "@/db/schema";
import {
  clampLane,
  clampProgress,
  progressToVw,
  vwToProgress,
  type BadgeLook,
} from "@/lib/badge-look";
import { formatUsd, getLevelVisual } from "@/lib/bid-scale";
import { listingHref } from "@/lib/demo-data";
import { resolvePillTheme } from "@/lib/pill-themes";
import { cn } from "@/lib/utils";

const DRAG_THRESHOLD_PX = 5;

export type BadgePlace = {
  progress: number;
  lane: number;
};

type FloatingBadgeProps = {
  listing: Listing;
  look: BadgeLook;
  onLoop: () => void;
  onPlace?: (place: BadgePlace) => void;
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

function fieldBox(el: HTMLElement) {
  const parent = el.offsetParent instanceof HTMLElement ? el.offsetParent : el.parentElement;
  return parent?.getBoundingClientRect() ?? el.getBoundingClientRect();
}

/**
 * JS-driven L→R loop. X is written as translate3d so the start point is a
 * real coordinate (refresh = new XY). Pointer-drag pauses the loop and
 * writes px so the pill follows the cursor.
 */
export function FloatingBadge({
  listing,
  look,
  onLoop,
  onPlace,
  demo = false,
}: FloatingBadgeProps) {
  const visual = getLevelVisual(listing.level);
  const theme = resolvePillTheme(listing.theme);
  const duration = visual.duration;
  const nodeRef = useRef<HTMLAnchorElement>(null);
  const liftRef = useRef<HTMLSpanElement>(null);
  const lookRef = useRef(look);
  const durationRef = useRef(duration);
  const onLoopRef = useRef(onLoop);
  const onPlaceRef = useRef(onPlace);
  const progressRef = useRef(look.progress);
  const draggingRef = useRef(false);
  const didDragRef = useRef(false);
  const dragPosRef = useRef<{ x: number; y: number } | null>(null);
  const grabRef = useRef({ x: 0, y: 0, startX: 0, startY: 0 });
  const waitingRef = useRef(0);
  const [iconFailed, setIconFailed] = useState(false);

  lookRef.current = look;
  durationRef.current = duration;
  onLoopRef.current = onLoop;
  onPlaceRef.current = onPlace;

  useLayoutEffect(() => {
    const el = nodeRef.current;
    if (!el) return;

    progressRef.current = lookRef.current.progress;
    waitingRef.current = lookRef.current.enterDelay;

    const paint = () => {
      if (draggingRef.current) return;
      el.style.transform = `translate3d(${progressToVw(progressRef.current)}vw, 0, 0)`;
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

      if (!draggingRef.current) {
        if (waitingRef.current > 0) {
          waitingRef.current -= dt;
        } else {
          progressRef.current += dt / durationRef.current;
          if (progressRef.current >= 1) {
            progressRef.current -= 1;
            onLoopRef.current();
          }
          paint();
        }
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  useLayoutEffect(() => {
    const el = nodeRef.current;
    if (!el || !draggingRef.current) return;
    applyDragPos(el);
    // Re-apply after parent re-renders (other badges wrapping).
  });

  function applyDragPos(el: HTMLAnchorElement) {
    const pos = dragPosRef.current;
    if (!pos) return;
    el.style.transform = `translate3d(${pos.x}px, 0, 0)`;
    el.style.top = `${pos.y}px`;
    el.classList.add("badge-drift--dragging");
    liftRef.current?.classList.add("pill-lift--up");
  }

  function setLifted(on: boolean) {
    const el = nodeRef.current;
    const lift = liftRef.current;
    el?.classList.toggle("badge-drift--dragging", on);
    lift?.classList.toggle("pill-lift--up", on);
  }

  function onPointerDown(e: PointerEvent<HTMLAnchorElement>) {
    if (e.button !== 0) return;
    const el = nodeRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    grabRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      startX: e.clientX,
      startY: e.clientY,
    };
    didDragRef.current = false;
    draggingRef.current = false;
    el.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent<HTMLAnchorElement>) {
    const el = nodeRef.current;
    if (!el || !el.hasPointerCapture(e.pointerId)) return;

    const grab = grabRef.current;
    const dx = e.clientX - grab.startX;
    const dy = e.clientY - grab.startY;
    if (!draggingRef.current) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
      draggingRef.current = true;
      didDragRef.current = true;
      waitingRef.current = 0;
      setLifted(true);
    }

    e.preventDefault();
    const field = fieldBox(el);
    dragPosRef.current = {
      x: e.clientX - grab.x - field.left,
      y: e.clientY - grab.y - field.top,
    };
    applyDragPos(el);
  }

  function finishDrag(el: HTMLAnchorElement) {
    if (!draggingRef.current) return;
    const field = fieldBox(el);
    const rect = el.getBoundingClientRect();
    const leftVw = ((rect.left - field.left) / field.width) * 100;
    const lane = clampLane((rect.top - field.top) / field.height);
    const progress = clampProgress(vwToProgress(leftVw));
    progressRef.current = progress;
    el.style.top = `${lane * 100}%`;
    el.style.transform = `translate3d(${progressToVw(progress)}vw, 0, 0)`;
    setLifted(false);
    draggingRef.current = false;
    dragPosRef.current = null;
    onPlaceRef.current?.({ progress, lane });
  }

  function onPointerUp(e: PointerEvent<HTMLAnchorElement>) {
    const el = nodeRef.current;
    if (!el) return;
    if (el.hasPointerCapture(e.pointerId)) {
      el.releasePointerCapture(e.pointerId);
    }
    if (draggingRef.current) {
      e.preventDefault();
      finishDrag(el);
    }
  }

  function onClick(e: MouseEvent<HTMLAnchorElement>) {
    if (!didDragRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    didDragRef.current = false;
  }

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
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onLostPointerCapture={onPointerUp}
      onClick={onClick}
      className="badge-drift group absolute left-0 will-change-transform"
      style={{
        top: `${look.lane * 100}%`,
        zIndex: Math.round(10 + visual.strength * 40),
      }}
      title={`${listing.title} — Lv ${listing.level} · ${formatUsd(listing.bid)} · ${theme.label}`}
    >
      <span ref={liftRef} className="pill-lift">
        <span
          className={cn(
            "pill-mark",
            visual.strength < 0.2 && "pill-mark--quiet"
          )}
          style={pillStyle}
        >
          {listing.faviconUrl && !iconFailed ? (
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
      </span>
    </a>
  );
}
