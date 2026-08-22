"use client";

import { useEffect, useMemo, useState } from "react";
import type { Listing } from "@/db/schema";
import { FloatingBadge } from "@/components/floating-badge";
import {
  rerollOnLoop,
  rollField,
  type BadgeLook,
} from "@/lib/badge-look";

type BadgeFieldProps = {
  listings: Listing[];
};

export function BadgeField({ listings }: BadgeFieldProps) {
  const listingKey = useMemo(
    () =>
      listings
        .map((listing) => listing.id)
        .sort()
        .join("|"),
    [listings]
  );
  const [looks, setLooks] = useState<Map<string, BadgeLook> | null>(null);

  useEffect(() => {
    if (!listingKey) {
      setLooks(new Map());
      return;
    }
    setLooks(rollField(listingKey.split("|")));
  }, [listingKey]);

  function handleLoop(id: string) {
    setLooks((prev) => {
      if (!prev) return prev;
      const current = prev.get(id);
      if (!current) return prev;
      const occupied = [...prev.entries()]
        .filter(([otherId]) => otherId !== id)
        .map(([, look]) => look.lane);
      const next = new Map(prev);
      next.set(id, rerollOnLoop(current, occupied));
      return next;
    });
  }

  return (
    <section className="badge-field relative h-[100dvh] w-screen overflow-hidden bg-[#f7f6f3]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(180,210,220,0.35),transparent_45%),radial-gradient(ellipse_at_90%_80%,rgba(220,200,180,0.22),transparent_40%),linear-gradient(180deg,#faf9f7_0%,#f3f1ec_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E\")",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(247,246,243,0.85)_0%,transparent_10%,transparent_90%,rgba(247,246,243,0.85)_100%),linear-gradient(180deg,rgba(247,246,243,0.75)_0%,transparent_10%,transparent_92%,rgba(247,246,243,0.5)_100%)]"
      />

      <div className="absolute inset-0">
        {listings.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6">
            <p className="max-w-sm text-center text-sm text-neutral-400">
              The field is empty. Add a link — size and drift speed follow
              your level. Pick a pill color when you submit.
            </p>
          </div>
        ) : looks == null ? null : (
          listings.map((listing) => {
            const look = looks.get(listing.id);
            if (!look) return null;
            return (
              <FloatingBadge
                key={listing.id}
                listing={listing}
                look={look}
                onLoop={() => handleLoop(listing.id)}
              />
            );
          })
        )}
      </div>
    </section>
  );
}
