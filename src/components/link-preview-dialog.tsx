"use client";

import { useEffect, useRef, useState } from "react";
import {
  ExternalLink,
  Loader2,
  MousePointerClick,
  Rocket,
} from "lucide-react";
import type { BoostMessage, Listing } from "@/db/schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatUsd } from "@/lib/bid-scale";
import { resolvePillTheme } from "@/lib/pill-themes";

const MESSAGE_CAP = 10;

export type ListingPreview = Listing & {
  messages?: BoostMessage[];
  rank?: number | null;
};

type LinkPreviewDialogProps = {
  listing: ListingPreview | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBoost: (listing: Listing) => void;
  demo?: boolean;
  /** Preloaded detail for demo mode (rank + messages). */
  demoDetail?: ListingPreview | null;
};

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function xProfileUrl(handle: string) {
  return `https://x.com/${encodeURIComponent(handle)}`;
}

function formatWhen(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function previewDescription(listing: Listing): {
  text: string;
  source: "creator" | "og" | null;
} {
  const creator = listing.description?.trim() ?? "";
  if (creator) return { text: creator, source: "creator" };
  const og = listing.ogDescription?.trim() ?? "";
  if (og) return { text: og, source: "og" };
  return { text: "", source: null };
}

export function LinkPreviewDialog({
  listing,
  open,
  onOpenChange,
  onBoost,
  demo = false,
  demoDetail,
}: LinkPreviewDialogProps) {
  const [detail, setDetail] = useState<ListingPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [visitLoading, setVisitLoading] = useState(false);
  const [showAllMessages, setShowAllMessages] = useState(false);
  const [ogFailed, setOgFailed] = useState(false);
  const trackedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) {
      setShowAllMessages(false);
      setOgFailed(false);
      trackedRef.current = null;
      return;
    }

    if (!listing) {
      setDetail(null);
      return;
    }

    if (demo) {
      setDetail(demoDetail ?? listing);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setDetail(listing);

    async function load() {
      if (trackedRef.current !== listing!.id) {
        trackedRef.current = listing!.id;
        try {
          await fetch("/api/click", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: listing!.id, action: "click" }),
          });
        } catch {
          // non-blocking
        }
      }

      try {
        const res = await fetch(`/api/listings/${listing!.id}`);
        if (res.ok) {
          const data = (await res.json()) as {
            listing: Listing;
            messages: BoostMessage[];
            rank: number | null;
          };
          if (!cancelled) {
            setDetail({
              ...data.listing,
              messages: data.messages,
              rank: data.rank,
            });
          }
        }
      } catch {
        // keep initial listing
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [open, listing, demo, demoDetail]);

  const row = detail ?? listing;
  const pill = row ? resolvePillTheme(row.theme) : null;
  const desc = row ? previewDescription(row) : { text: "", source: null };
  const messages = row?.messages ?? [];
  const visibleMessages = showAllMessages
    ? messages
    : messages.slice(0, MESSAGE_CAP);
  const hasMoreMessages = messages.length > MESSAGE_CAP;

  const showOgImage = Boolean(row?.ogImageUrl) && !ogFailed;

  async function onVisit() {
    if (!row) return;
    setVisitLoading(true);
    try {
      if (!demo) {
        const res = await fetch("/api/click", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: row.id, action: "visit" }),
        });
        const data = res.ok ? await res.json() : null;
        window.open(data?.url ?? row.url, "_blank", "noopener,noreferrer");
      } else {
        window.open(row.url, "_blank", "noopener,noreferrer");
      }
      onOpenChange(false);
    } finally {
      setVisitLoading(false);
    }
  }

  function onBoostClick() {
    if (!row) return;
    onOpenChange(false);
    onBoost(row);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(92dvh,44rem)] overflow-y-auto border-neutral-200 bg-white p-0 text-neutral-900 sm:max-w-md">
        {row ? (
          <>
            {showOgImage ? (
              <div className="relative aspect-[1.91/1] w-full overflow-hidden rounded-t-xl bg-neutral-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={row.ogImageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={() => setOgFailed(true)}
                />
              </div>
            ) : null}

            <div className="space-y-4 p-4 sm:p-5">
              <DialogHeader className="gap-3 text-left">
                <div className="flex items-start gap-3">
                  {row.faviconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={row.faviconUrl}
                      alt=""
                      width={28}
                      height={28}
                      className="mt-0.5 size-7 shrink-0 rounded-sm"
                    />
                  ) : pill ? (
                    <span
                      className="mt-1 size-7 shrink-0 rounded-full border"
                      style={{
                        background: pill.bg,
                        borderColor: pill.outline,
                      }}
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="font-[family-name:var(--font-display)] text-xl leading-tight">
                      {row.title}
                    </DialogTitle>
                    <DialogDescription className="mt-1 truncate text-neutral-400">
                      {hostname(row.url)}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {desc.text ? (
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                  {desc.source === "creator" ? (
                    <p className="text-[10px] uppercase tracking-wider text-neutral-400">
                      Creator note
                    </p>
                  ) : null}
                  <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                    {desc.text}
                  </p>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-neutral-500">
                <span>
                  <span className="text-neutral-400">Bid</span>{" "}
                  <span className="font-mono text-neutral-800">
                    {formatUsd(row.bid)}
                  </span>
                </span>
                <span>Lv {row.level}</span>
                {row.rank != null ? (
                  <span>Rank #{row.rank}</span>
                ) : null}
                <span className="inline-flex items-center gap-1">
                  <MousePointerClick className="size-3.5" />
                  <span className="tabular-nums">{row.clicks}</span>
                  <span className="text-neutral-400">clicks</span>
                </span>
                <span className="tabular-nums">
                  {row.visits ?? 0}{" "}
                  <span className="text-neutral-400">visits</span>
                </span>
              </div>

              {messages.length > 0 ? (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-neutral-400">
                    Support
                  </p>
                  <ul className="mt-2 space-y-2 border-l border-neutral-200 pl-3">
                    {visibleMessages.map((msg) => (
                      <li key={msg.id} className="text-sm text-neutral-500">
                        <span className="text-neutral-700">
                          &ldquo;{msg.message}&rdquo;
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
                        <span className="ml-2 text-[10px] text-neutral-300">
                          {formatWhen(msg.createdAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {hasMoreMessages && !showAllMessages ? (
                    <button
                      type="button"
                      className="mt-2 text-xs text-neutral-500 underline-offset-2 hover:text-neutral-800 hover:underline"
                      onClick={() => setShowAllMessages(true)}
                    >
                      Show {messages.length - MESSAGE_CAP} more
                    </button>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-neutral-400">
                  No support messages yet. Be the first to boost.
                </p>
              )}

              {loading ? (
                <p className="flex items-center gap-2 text-xs text-neutral-400">
                  <Loader2 className="size-3.5 animate-spin" />
                  Refreshing preview…
                </p>
              ) : null}
            </div>

            <DialogFooter className="gap-2 border-t border-neutral-200 bg-neutral-50/80 p-4 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="border-neutral-200 bg-white"
                onClick={onBoostClick}
              >
                <Rocket className="size-4" />
                Boost & support
              </Button>
              <Button
                type="button"
                disabled={visitLoading}
                className="bg-neutral-900 text-white hover:bg-neutral-800"
                onClick={() => void onVisit()}
              >
                {visitLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ExternalLink className="size-4" />
                )}
                Visit site
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="p-6 text-sm text-neutral-500">No link selected.</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
