"use client";

import { useMemo, useState } from "react";
import { MousePointerClick, Rocket } from "lucide-react";
import type { BoostMessage, Listing } from "@/db/schema";
import { formatUsd } from "@/lib/bid-scale";
import { resolvePillTheme } from "@/lib/pill-themes";
import { Button } from "@/components/ui/button";
import { BoostDialog } from "@/components/boost-dialog";
import {
  LinkPreviewDialog,
  type ListingPreview,
} from "@/components/link-preview-dialog";
import type { EconomySnapshot } from "@/lib/pricing";
import { CLICKS_PER_SLOT } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export type ListingWithMessages = Listing & {
  messages: BoostMessage[];
};

type LeaderboardProps = {
  listings: ListingWithMessages[];
  economy: EconomySnapshot;
  demo?: boolean;
};

function xProfileUrl(handle: string) {
  return `https://x.com/${encodeURIComponent(handle)}`;
}

export function Leaderboard({ listings, economy, demo = false }: LeaderboardProps) {
  const [boostTarget, setBoostTarget] = useState<Listing | null>(null);
  const [previewTarget, setPreviewTarget] = useState<ListingWithMessages | null>(
    null
  );

  const ranked = useMemo(
    () => [...listings].sort((a, b) => b.bid - a.bid || b.clicks - a.clicks),
    [listings]
  );

  const previewDetail: ListingPreview | null = useMemo(() => {
    if (!previewTarget) return null;
    const rank =
      ranked.findIndex((row) => row.id === previewTarget.id) + 1 || null;
    return { ...previewTarget, rank };
  }, [previewTarget, ranked]);

  return (
    <section className="relative z-10">
      <div className="mx-auto w-full max-w-3xl px-4 pb-20 pt-24 sm:px-6">
        <div className="mb-8">
          <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-tight text-neutral-900 sm:text-5xl">
            Rank
          </h1>
          <p className="mt-2 max-w-lg text-sm text-neutral-500 sm:text-base">
            Highest support on top. Boost any link, leave a note, drop your X
            handle. You only pay the difference.
          </p>
          <p className="mt-3 text-xs text-neutral-400">
            Tier {economy.tier} · {formatUsd(economy.minCents)}–
            {formatUsd(economy.maxCents)} · {economy.listingCount} links ·{" "}
            {economy.totalClicks} clicks
            {economy.clickSlots > 0
              ? ` (+${economy.clickSlots} from traffic)`
              : ""}
            . Every {CLICKS_PER_SLOT} clicks nudges the rate up —
            {economy.clicksToNextSlot} to next slot.
          </p>
        </div>

        {ranked.length === 0 ? (
          <div className="border border-dashed border-neutral-300 px-5 py-14 text-center text-sm text-neutral-500">
            No listings yet. Add a link from the field, then boost to climb.
          </div>
        ) : (
          <ol className="divide-y divide-neutral-200 border-y border-neutral-200">
            {ranked.map((listing, index) => {
              const rank = index + 1;
              const isTop = rank <= 3;
              const recent = listing.messages.slice(0, 3);
              const showIcon = Boolean(listing.faviconUrl);
              const pill = resolvePillTheme(listing.theme);

              return (
                <li key={listing.id} className="py-5 sm:py-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <span
                      className={cn(
                        "w-8 shrink-0 pt-1 text-center font-mono text-sm tabular-nums",
                        isTop ? "text-neutral-900" : "text-neutral-300"
                      )}
                    >
                      {rank}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setPreviewTarget(listing)}
                          className="group flex min-w-0 flex-1 items-start gap-2.5 text-left"
                        >
                          {showIcon ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={listing.faviconUrl}
                              alt=""
                              width={20}
                              height={20}
                              className="mt-1 size-5 shrink-0 rounded-sm"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : null}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="size-2.5 shrink-0 rounded-full border"
                                style={{
                                  background: pill.bg,
                                  borderColor: pill.outline,
                                }}
                                title={pill.label}
                              />
                              <span className="truncate font-[family-name:var(--font-display)] text-lg text-neutral-900 group-hover:text-neutral-600 sm:text-xl">
                                {listing.title}
                              </span>
                            </div>
                            <p className="mt-0.5 truncate text-xs text-neutral-400 sm:text-sm">
                              {listing.url}
                            </p>
                          </div>
                        </button>

                        <div className="flex shrink-0 items-center gap-3">
                          <div className="hidden items-center gap-2 text-xs text-neutral-400 sm:flex">
                            <span className="inline-flex items-center gap-1">
                              <MousePointerClick className="size-3.5" />
                              <span className="tabular-nums">{listing.clicks}</span>
                            </span>
                            <span className="tabular-nums">
                              {listing.visits ?? 0} visits
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="font-mono text-sm tabular-nums text-neutral-800">
                              {formatUsd(listing.bid)}
                            </p>
                            <p className="text-[10px] uppercase tracking-wider text-neutral-400">
                              Lv {listing.level}
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-8 shrink-0 px-2 text-neutral-700 hover:bg-neutral-100"
                            onClick={() => setBoostTarget(listing)}
                          >
                            <Rocket className="size-3.5" />
                            Boost
                          </Button>
                        </div>
                      </div>

                      {recent.length > 0 && (
                        <ul className="mt-4 space-y-2 border-l border-neutral-200 pl-3">
                          {recent.map((msg) => (
                            <li key={msg.id} className="text-sm text-neutral-500">
                              <span className="text-neutral-700">
                                “{msg.message}”
                              </span>
                              {msg.xHandle ? (
                                <>
                                  {" "}
                                  <a
                                    href={xProfileUrl(msg.xHandle)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-neutral-800 underline-offset-2 hover:underline"
                                  >
                                    @{msg.xHandle}
                                  </a>
                                </>
                              ) : null}
                              <span className="ml-2 font-mono text-[10px] text-neutral-300">
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

      <LinkPreviewDialog
        listing={previewTarget}
        open={!!previewTarget}
        onOpenChange={(open) => {
          if (!open) setPreviewTarget(null);
        }}
        onBoost={setBoostTarget}
        demo={demo}
        demoDetail={previewDetail}
      />

      <BoostDialog
        listing={boostTarget}
        open={!!boostTarget}
        onOpenChange={(open) => {
          if (!open) setBoostTarget(null);
        }}
        economy={economy}
      />
    </section>
  );
}
