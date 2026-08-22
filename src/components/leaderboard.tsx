"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ArrowUpRight, Rocket } from "lucide-react";
import type { BoostMessage, Listing } from "@/db/schema";
import { formatUsd } from "@/lib/bid-scale";
import { resolvePillTheme } from "@/lib/pill-themes";
import { Button } from "@/components/ui/button";
import { BoostDialog } from "@/components/boost-dialog";
import type { EconomySnapshot } from "@/lib/pricing";
import { CLICKS_PER_SLOT } from "@/lib/pricing";
import { listingHref } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

export type ListingWithMessages = Listing & {
  messages: BoostMessage[];
  supporters: number;
};

type LeaderboardProps = {
  listings: ListingWithMessages[];
  economy: EconomySnapshot;
  demo?: boolean;
};

type SortKey = "site" | "title" | "supporters" | "clicks" | "level";

function xProfileUrl(handle: string) {
  return `https://x.com/${encodeURIComponent(handle)}`;
}

function siteHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function compareDefault(a: ListingWithMessages, b: ListingWithMessages) {
  if (b.level !== a.level) return b.level - a.level;
  const scoreA = a.level * a.supporters;
  const scoreB = b.level * b.supporters;
  if (scoreB !== scoreA) return scoreB - scoreA;
  return b.clicks - a.clicks;
}

function compareBy(
  a: ListingWithMessages,
  b: ListingWithMessages,
  key: SortKey,
  dir: 1 | -1
) {
  let result = 0;
  switch (key) {
    case "site":
      result = siteHost(a.url).localeCompare(siteHost(b.url));
      break;
    case "title":
      result = a.title.localeCompare(b.title);
      break;
    case "supporters":
      result = a.supporters - b.supporters;
      break;
    case "clicks":
      result = a.clicks - b.clicks;
      break;
    case "level":
      result = a.level - b.level;
      break;
  }
  if (result !== 0) return result * dir;
  return compareDefault(a, b);
}

const COLUMNS: { key: SortKey; label: string; align?: "left" | "right" }[] = [
  { key: "site", label: "Site", align: "left" },
  { key: "title", label: "Title", align: "left" },
  { key: "supporters", label: "Supporters", align: "right" },
  { key: "clicks", label: "Clicks", align: "right" },
  { key: "level", label: "Lv", align: "right" },
];

export function Leaderboard({
  listings,
  economy,
  demo = false,
}: LeaderboardProps) {
  const [boostTarget, setBoostTarget] = useState<Listing | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("level");
  const [sortDir, setSortDir] = useState<1 | -1>(-1);

  const ranked = useMemo(() => {
    const rows = [...listings];
    if (sortKey === "level" && sortDir === -1) {
      rows.sort(compareDefault);
    } else {
      rows.sort((a, b) => compareBy(a, b, sortKey, sortDir));
    }
    return rows;
  }, [listings, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === -1 ? 1 : -1));
      return;
    }
    setSortKey(key);
    setSortDir(key === "title" || key === "site" ? 1 : -1);
  }

  function SortIcon({ column }: { column: SortKey }) {
    if (sortKey !== column) {
      return <ArrowUpDown className="size-3 opacity-35" aria-hidden />;
    }
    return sortDir === -1 ? (
      <ArrowDown className="size-3" aria-hidden />
    ) : (
      <ArrowUp className="size-3" aria-hidden />
    );
  }

  return (
    <section className="relative z-10">
      <div className="mx-auto w-full max-w-5xl px-4 pb-20 pt-24 sm:px-6">
        <div className="mb-8">
          <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-tight text-neutral-900 sm:text-5xl">
            Rank
          </h1>
          <p className="mt-2 max-w-lg text-sm text-neutral-500 sm:text-base">
            Highest level on top. Same level ranks by level × supporters. Boost
            any link — you only pay the difference.
          </p>
          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-400">
            Tier {economy.tier} · {formatUsd(economy.minCents)}–
            {formatUsd(economy.maxCents)} · {economy.listingCount} links ·{" "}
            {economy.totalClicks} clicks
            {economy.clickSlots > 0
              ? ` · +${economy.clickSlots} from traffic`
              : ""}
            · every {CLICKS_PER_SLOT} clicks nudges rate ·{" "}
            {economy.clicksToNextSlot} to next
          </p>
        </div>

        {ranked.length === 0 ? (
          <div className="border border-dashed border-neutral-300 bg-white/50 px-5 py-14 text-center text-sm text-neutral-500">
            No listings yet. Add a link from the field, then boost to climb.
          </div>
        ) : (
          <div className="receipt overflow-hidden border border-neutral-300/80 bg-[#fffcf7] shadow-[0_1px_0_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between border-b border-dashed border-neutral-300 px-3 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-400 sm:px-4">
              <span>rank.fish · ledger</span>
              <span>{ranked.length} lines</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-neutral-300 bg-[#f3efe6]/40">
                    {COLUMNS.map((col) => (
                      <th
                        key={col.key}
                        scope="col"
                        className={cn(
                          "px-3 py-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-500 sm:px-4",
                          col.align === "right" ? "text-right" : "text-left",
                          col.key === "title" && "min-w-[10rem]"
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => toggleSort(col.key)}
                          className={cn(
                            "inline-flex items-center gap-1.5 transition-colors hover:text-neutral-900",
                            col.align === "right" && "flex-row-reverse",
                            sortKey === col.key && "text-neutral-900"
                          )}
                          aria-label={`Sort by ${col.label}`}
                        >
                          {col.label}
                          <SortIcon column={col.key} />
                        </button>
                      </th>
                    ))}
                    <th
                      scope="col"
                      className="px-3 py-2.5 text-right font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-500 sm:px-4"
                    >
                      Boost
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ranked.map((listing, index) => {
                    const host = siteHost(listing.url);
                    const showIcon = Boolean(listing.faviconUrl);
                    const recent = listing.messages.slice(0, 2);
                    const isTop = index < 3;
                    const pill = resolvePillTheme(listing.theme);
                    const href = listingHref(listing, demo);

                    return (
                      <tr
                        key={listing.id}
                        className={cn(
                          "group border-b border-dashed border-neutral-200/90 transition-colors hover:bg-[#f7f3ea]/70",
                          isTop && "bg-[#faf6ee]/60"
                        )}
                      >
                        <td className="px-3 py-3.5 align-middle sm:px-4">
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex min-w-0 items-center gap-2.5"
                          >
                            {showIcon ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={listing.faviconUrl}
                                alt=""
                                width={16}
                                height={16}
                                className="size-4 shrink-0 rounded-[2px]"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            ) : (
                              <span className="size-4 shrink-0 rounded-[2px] border border-dashed border-neutral-300" />
                            )}
                            <span className="truncate font-mono text-xs text-neutral-600 group-hover:text-neutral-900">
                              {host}
                            </span>
                          </a>
                        </td>

                        <td className="px-3 py-3.5 align-middle sm:px-4">
                          <div className="min-w-0">
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group/title inline-flex max-w-full items-center gap-1.5 font-[family-name:var(--font-display)] text-[15px] leading-snug text-neutral-900"
                            >
                              <span
                                className="size-2.5 shrink-0 rounded-full border"
                                style={{
                                  background: pill.bg,
                                  borderColor: pill.outline,
                                }}
                                title={pill.label}
                              />
                              <span className="truncate">{listing.title}</span>
                              <ArrowUpRight className="size-3.5 shrink-0 text-neutral-300 opacity-0 transition group-hover/title:opacity-100" />
                            </a>
                            {listing.xHandle ? (
                              <a
                                href={xProfileUrl(listing.xHandle)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-0.5 block truncate text-[11px] text-neutral-500 underline-offset-2 hover:text-neutral-800 hover:underline"
                              >
                                @{listing.xHandle}
                              </a>
                            ) : null}
                            {recent.length > 0 ? (
                              <p className="mt-1 truncate text-[11px] text-neutral-400">
                                “{recent[0].message}”
                                {recent[0].xHandle ? (
                                  <>
                                    {" "}
                                    <a
                                      href={xProfileUrl(recent[0].xHandle)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-neutral-600 underline-offset-2 hover:underline"
                                    >
                                      @{recent[0].xHandle}
                                    </a>
                                  </>
                                ) : null}
                              </p>
                            ) : null}
                          </div>
                        </td>

                        <td className="px-3 py-3.5 text-right align-middle font-mono text-xs tabular-nums text-neutral-700 sm:px-4">
                          {listing.supporters}
                        </td>
                        <td className="px-3 py-3.5 text-right align-middle font-mono text-xs tabular-nums text-neutral-700 sm:px-4">
                          {listing.clicks}
                        </td>
                        <td className="px-3 py-3.5 text-right align-middle sm:px-4">
                          <span className="font-mono text-sm tabular-nums text-neutral-900">
                            {listing.level}
                          </span>
                          <span className="mt-0.5 block font-mono text-[10px] tabular-nums text-neutral-400">
                            {formatUsd(listing.bid)}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 text-right align-middle sm:px-4">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-8 shrink-0 gap-1.5 px-2 font-mono text-[11px] uppercase tracking-wider text-neutral-700 hover:bg-neutral-900 hover:text-white"
                            onClick={() => setBoostTarget(listing)}
                          >
                            <Rocket className="size-3.5" />
                            Boost
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="border-t border-dashed border-neutral-300 px-3 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-400 sm:px-4">
              Sorted by {sortKey}
              {sortKey === "level" && sortDir === -1
                ? " · ties → lv × supporters"
                : sortDir === -1
                  ? " · desc"
                  : " · asc"}
            </div>
          </div>
        )}
      </div>

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
