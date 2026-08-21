"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, MousePointerClick, Rocket } from "lucide-react";
import type { Listing } from "@/db/schema";
import { formatUsd } from "@/lib/bid-scale";
import { Button } from "@/components/ui/button";
import { BoostDialog } from "@/components/boost-dialog";
import { cn } from "@/lib/utils";

type LeaderboardProps = {
  listings: Listing[];
};

export function Leaderboard({ listings }: LeaderboardProps) {
  const [boostTarget, setBoostTarget] = useState<Listing | null>(null);

  const ranked = useMemo(
    () => [...listings].sort((a, b) => b.bid - a.bid || b.clicks - a.clicks),
    [listings]
  );

  return (
    <section className="relative z-10 border-b border-white/8 bg-[#070b10]/95 backdrop-blur-md">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-teal-300/70">
              Ranked
            </p>
            <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl tracking-tight text-white sm:text-3xl">
              Leaderboard
            </h2>
          </div>
          <p className="hidden text-right text-sm text-white/45 sm:block">
            Highest bid sits on top.
            <br />
            Boost to climb.
          </p>
        </div>

        {ranked.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/12 px-5 py-10 text-center text-sm text-white/45">
            No listings yet. Be the first ripple on the board.
          </div>
        ) : (
          <ol className="space-y-1.5">
            {ranked.map((listing, index) => {
              const rank = index + 1;
              const isTop = rank <= 3;

              return (
                <li
                  key={listing.id}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors sm:gap-4 sm:px-4",
                    isTop
                      ? "bg-teal-400/[0.07] hover:bg-teal-400/[0.11]"
                      : "hover:bg-white/[0.03]"
                  )}
                >
                  <span
                    className={cn(
                      "w-7 shrink-0 text-center font-mono text-sm tabular-nums",
                      isTop ? "text-teal-300" : "text-white/35"
                    )}
                  >
                    {rank}
                  </span>

                  <a
                    href={`/api/click?id=${listing.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-0 flex-1"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="truncate font-medium text-white/95 group-hover:text-teal-100">
                        {listing.title}
                      </span>
                      <ArrowUpRight className="size-3.5 shrink-0 text-white/25 opacity-0 transition group-hover:opacity-100" />
                    </div>
                    <p className="truncate text-xs text-white/40">
                      {listing.description || listing.url}
                    </p>
                  </a>

                  <div className="hidden items-center gap-1 text-xs text-white/35 sm:flex">
                    <MousePointerClick className="size-3.5" />
                    <span className="tabular-nums">{listing.clicks}</span>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="font-mono text-sm tabular-nums text-teal-200/90">
                      {formatUsd(listing.bid)}
                    </p>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 shrink-0 px-2 text-teal-200/80 hover:bg-teal-400/10 hover:text-teal-100 sm:px-2.5"
                    onClick={() => setBoostTarget(listing)}
                  >
                    <Rocket className="size-3.5" />
                    <span className="hidden sm:inline">Boost</span>
                  </Button>
                </li>
              );
            })}
          </ol>
        )}

        {ranked.length > 0 && (
          <p className="mt-4 text-center text-[11px] text-white/30 sm:hidden">
            Tap Boost on any row to outbid · only pay the difference
          </p>
        )}
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
