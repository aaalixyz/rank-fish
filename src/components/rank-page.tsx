"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import {
  Leaderboard,
  type ListingWithMessages,
} from "@/components/leaderboard";

type RankPageProps = {
  listings: ListingWithMessages[];
};

/**
 * Page 2 — scrollable vertical rank list with boost + support messages.
 */
export function RankPage({ listings }: RankPageProps) {
  const router = useRouter();

  useEffect(() => {
    const id = window.setInterval(() => {
      router.refresh();
    }, 20_000);
    return () => window.clearInterval(id);
  }, [router]);

  return (
    <div className="dark relative min-h-screen overflow-x-hidden bg-[#05080c] text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_40%_0%,rgba(45,212,191,0.1),transparent_45%),linear-gradient(180deg,#05080c_0%,#081018_40%,#05070a_100%)]"
      />
      <SiteHeader />
      <Leaderboard listings={listings} />
    </div>
  );
}
