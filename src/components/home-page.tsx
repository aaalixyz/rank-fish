"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Listing } from "@/db/schema";
import { SiteHeader } from "@/components/site-header";
import { BadgeField } from "@/components/badge-field";
import { BoostDialog } from "@/components/boost-dialog";
import {
  LinkPreviewDialog,
  type ListingPreview,
} from "@/components/link-preview-dialog";
import { useDemoMode } from "@/components/demo-mode";
import type { DemoListing } from "@/lib/demo-data";
import type { EconomySnapshot } from "@/lib/pricing";

type HomePageProps = {
  listings: Listing[];
  economy: EconomySnapshot;
};

function demoPreviewDetail(
  target: Listing,
  rows: DemoListing[]
): ListingPreview | null {
  const found = rows.find((row) => row.id === target.id);
  if (!found) return null;
  const ranked = [...rows].sort(
    (a, b) => b.bid - a.bid || b.clicks - a.clicks
  );
  const rank = ranked.findIndex((row) => row.id === target.id) + 1;
  return { ...found, messages: found.messages, rank: rank || null };
}

export function HomePage({ listings, economy }: HomePageProps) {
  const router = useRouter();
  const demo = useDemoMode();
  const rows = demo.active ? demo.listings : listings;
  const eco = demo.active ? demo.economy : economy;
  const [previewTarget, setPreviewTarget] = useState<Listing | null>(null);
  const [boostTarget, setBoostTarget] = useState<Listing | null>(null);

  const demoDetail = useMemo(() => {
    if (!previewTarget || !demo.active) return null;
    return demoPreviewDetail(previewTarget, demo.listings);
  }, [previewTarget, demo.active, demo.listings]);

  useEffect(() => {
    if (demo.active) return;
    const id = window.setInterval(() => {
      router.refresh();
    }, 20_000);
    return () => window.clearInterval(id);
  }, [router, demo.active]);

  useEffect(() => {
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, []);

  return (
    <div className="relative h-[100dvh] w-screen overflow-hidden bg-[#f7f6f3] text-neutral-900">
      <SiteHeader economy={eco} />
      <BadgeField listings={rows} onOpenLink={setPreviewTarget} />

      <LinkPreviewDialog
        listing={previewTarget}
        open={!!previewTarget}
        onOpenChange={(open) => {
          if (!open) setPreviewTarget(null);
        }}
        onBoost={setBoostTarget}
        demo={demo.active}
        demoDetail={demoDetail}
      />

      <BoostDialog
        listing={boostTarget}
        open={!!boostTarget}
        onOpenChange={(open) => {
          if (!open) setBoostTarget(null);
        }}
        economy={eco}
      />
    </div>
  );
}
