"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LevelSlider } from "@/components/level-slider";
import { ThemePicker } from "@/components/theme-picker";
import { formatUsd, getLevelVisual } from "@/lib/bid-scale";
import {
  DEFAULT_PILL_THEME,
  type PillThemeId,
  resolvePillTheme,
} from "@/lib/pill-themes";
import {
  CLICKS_PER_SLOT,
  levelToCents,
  type EconomySnapshot,
  buildEconomy,
} from "@/lib/pricing";

type CreateListingDialogProps = {
  triggerClassName?: string;
  triggerLabel?: string;
  triggerSize?: "default" | "sm" | "lg";
  /** Optional preloaded economy from the server */
  economy?: EconomySnapshot;
};

export function CreateListingDialog({
  triggerClassName,
  triggerLabel = "Add link",
  triggerSize = "default",
  economy: economyProp,
}: CreateListingDialogProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState(10);
  const [theme, setTheme] = useState<PillThemeId>(DEFAULT_PILL_THEME);
  const [economy, setEconomy] = useState<EconomySnapshot>(
    economyProp ?? buildEconomy(0, 0)
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (economyProp) setEconomy(economyProp);
  }, [economyProp]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch("/api/economy")
      .then((r) => r.json())
      .then((data: EconomySnapshot) => {
        if (!cancelled) setEconomy(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open]);

  const priceCents = useMemo(
    () =>
      levelToCents(level, economy.createMinCents, economy.createMaxCents),
    [level, economy.createMinCents, economy.createMaxCents]
  );
  const previewTheme = resolvePillTheme(theme);
  const previewStrength = getLevelVisual(level).strength;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "create",
          url: url.trim(),
          title: title.trim(),
          level,
          theme,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not start payment");
      }

      window.location.href = data.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        size={triggerSize}
        className={
          triggerClassName ??
          "bg-neutral-900 text-white hover:bg-neutral-800"
        }
        onClick={() => setOpen(true)}
      >
        {triggerLabel}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[min(92dvh,44rem)] overflow-y-auto border-neutral-200 bg-white text-neutral-900 sm:max-w-md">
          <form onSubmit={onSubmit}>
            <DialogHeader>
              <DialogTitle className="font-[family-name:var(--font-display)] text-xl">
                Add a link
              </DialogTitle>
              <DialogDescription className="text-neutral-500">
                Title + URL only. Favicon is picked up automatically when one
                exists. Higher level = bigger, slower pill on the field.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">Link</Label>
                <Input
                  id="url"
                  type="url"
                  required
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="border-neutral-200 bg-neutral-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  required
                  maxLength={120}
                  placeholder="My project"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="border-neutral-200 bg-neutral-50"
                />
              </div>

              <ThemePicker value={theme} onChange={setTheme} />

              <div
                className="flex justify-center rounded-xl border border-neutral-200 bg-[#f7f6f3] px-4 py-5"
                aria-hidden
              >
                <span
                  className="pill-mark pill-mark--static"
                  style={
                    {
                      "--s": previewStrength,
                      "--pill-bg": previewTheme.bg,
                      "--pill-fg": previewTheme.fg,
                      "--pill-outline": previewTheme.outline,
                    } as CSSProperties
                  }
                >
                  <span className="pill-mark__title">
                    {title.trim() || "My project"}
                  </span>
                </span>
              </div>

              <div className="space-y-3 rounded-xl border border-neutral-200 bg-neutral-50/80 px-4 py-3">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-neutral-400">
                      Level
                    </p>
                    <p className="font-[family-name:var(--font-display)] text-2xl tabular-nums">
                      Lv {level}
                    </p>
                  </div>
                  <p className="font-mono text-lg tabular-nums text-neutral-800">
                    {formatUsd(priceCents)}
                  </p>
                </div>
                <LevelSlider
                  id="create-level"
                  value={level}
                  onChange={setLevel}
                />
                <div className="flex justify-between text-[11px] text-neutral-400">
                  <span>
                    Lv 1 · {formatUsd(economy.createMinCents)}
                  </span>
                  <span>
                    Lv 100 · {formatUsd(economy.createMaxCents)}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-neutral-500">
                  Tier {economy.createTier}: range scales every 10 links (and
                  every {CLICKS_PER_SLOT} clicks). You — or anyone — can boost
                  later and only pay the difference.
                </p>
              </div>

              {error && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}
            </div>

            <DialogFooter className="mt-6 border-0 bg-transparent">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-neutral-900 text-white hover:bg-neutral-800 sm:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Redirecting…
                  </>
                ) : (
                  `Pay ${formatUsd(priceCents)} & appear`
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
