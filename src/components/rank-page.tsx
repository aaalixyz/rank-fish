"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import {
  Leaderboard,
  type ListingWithMessages,
} from "@/components/leaderboard";
import type { EconomySnapshot } from "@/lib/pricing";

type RankPageProps = {
  listings: ListingWithMessages[];
  economy: EconomySnapshot;
};

export function RankPage({ listings, economy }: RankPageProps) {
  const router = useRouter();

  useEffect(() => {
    const id = window.setInterval(() => {
      router.refresh();
    }, 20_000);
    return () => window.clearInterval(id);
  }, [router]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#f7f6f3] text-neutral-900">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_40%_0%,rgba(180,210,220,0.25),transparent_45%),linear-gradient(180deg,#faf9f7_0%,#f3f1ec_100%)]"
      />
      <SiteHeader economy={economy} />
      <Leaderboard listings={listings} economy={economy} />
    </div>
  );
}
