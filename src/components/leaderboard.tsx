"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, MousePointerClick, Rocket } from "lucide-react";
import type { BoostMessage, Listing } from "@/db/schema";
import { formatUsd } from "@/lib/bid-scale";
import { Button } from "@/components/ui/button";
import { BoostDialog } from "@/components/boost-dialog";
import { cn } from "@/lib/utils";

export type ListingWithMessages = Listing & {
  messages: BoostMessage[];
};

type LeaderboardProps = {
  listings: ListingWithMessages[];
};

function xProfileUrl(handle: string) {
  return `https://x.com/${encodeURIComponent(handle)}`;
}

export function Leaderboard({ listings }: LeaderboardProps) {
  const [boostTarget, setBoostTarget] = useState<Listing | null>(null);

  const ranked = useMemo(
    () => [...listings].sort((a, b) => b.bid - a.bid || b.clicks - a.clicks),
    [listings]
  );

  return (
    <section className="relative z-10">
      <div className="mx-auto w-full max-w-3xl px-4 pb-20 pt-24 sm:px-6">
        <div className="mb-10">
          <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-tight text-white sm:text-5xl">
            Rank
          </h1>
          <p className="mt-2 max-w-md text-sm text-white/45 sm:text-base">
            Highest support sits on top. Boost any link, leave a note, optionally
            drop your X handle.
          </p>
        </div>

        {ranked.length === 0 ? (
          <div className="border border-dashed border-white/12 px-5 py-14 text-center text-sm text-white/45">
            No listings yet. Add a link from the field, then boost to climb.
          </div>
        ) : (
          <ol className="divide-y divide-white/8 border-y border-white/8">
            {ranked.map((listing, index) => {
              const rank = index + 1;
              const isTop = rank <= 3;
              const recent = listing.messages.slice(0, 3);

              return (
                <li key={listing.id} className="py-5 sm:py-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <span
                      className={cn(
                        "w-8 shrink-0 pt-1 text-center font-mono text-sm tabular-nums",
                        isTop ? "text-teal-300" : "text-white/30"
                      )}
                    >
                      {rank}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <a
                          href={`/api/click?id=${listing.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group min-w-0 flex-1"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="truncate font-[family-name:var(--font-display)] text-lg text-white/95 group-hover:text-teal-100 sm:text-xl">
                              {listing.title}
                            </span>
                            <ArrowUpRight className="size-3.5 shrink-0 text-white/25 opacity-0 transition group-hover:opacity-100" />
                          </div>
                          <p className="mt-0.5 truncate text-xs text-white/40 sm:text-sm">
                            {listing.description || listing.url}
                          </p>
                        </a>

                        <div className="flex shrink-0 items-center gap-3">
                          <div className="hidden items-center gap-1 text-xs text-white/35 sm:flex">
                            <MousePointerClick className="size-3.5" />
                            <span className="tabular-nums">{listing.clicks}</span>
                          </div>
                          <p className="font-mono text-sm tabular-nums text-teal-200/90">
                            {formatUsd(listing.bid)}
                          </p>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-8 shrink-0 px-2 text-teal-200/80 hover:bg-teal-400/10 hover:text-teal-100"
                            onClick={() => setBoostTarget(listing)}
                          >
                            <Rocket className="size-3.5" />
                            Boost
                          </Button>
                        </div>
                      </div>

                      {recent.length > 0 && (
                        <ul className="mt-4 space-y-2 border-l border-teal-300/20 pl-3">
                          {recent.map((msg) => (
                            <li key={msg.id} className="text-sm text-white/55">
                              <span className="text-white/80">
                                “{msg.message}”
                              </span>
                              {msg.xHandle ? (
                                <>
                                  {" "}
                                  <a
                                    href={xProfileUrl(msg.xHandle)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-teal-300/80 hover:text-teal-200"
                                  >
                                    @{msg.xHandle}
                                  </a>
                                </>
                              ) : null}
                              <span className="ml-2 font-mono text-[10px] text-white/25">
                                +{formatUsd(msg.amountPaid)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
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
