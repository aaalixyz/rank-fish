"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Listing } from "@/db/schema";
import { SiteHeader } from "@/components/site-header";
import { Leaderboard } from "@/components/leaderboard";
import { BadgeField } from "@/components/badge-field";
import { CreateListingDialog } from "@/components/create-listing-dialog";

type HomePageProps = {
  listings: Listing[];
};

/**
 * Client shell so we can soft-refresh listings every so often
 * (webhooks update the DB; this picks up changes without a hard reload).
 */
export function HomePage({ listings }: HomePageProps) {
  const router = useRouter();

  useEffect(() => {
    const id = window.setInterval(() => {
      router.refresh();
    }, 20_000);
    return () => window.clearInterval(id);
  }, [router]);

  return (
    <div className="dark min-h-screen bg-[#05080c] text-white">
      <SiteHeader />

      {/* Hero — brand first, one line, one CTA. No clutter. */}
      <section className="relative overflow-hidden border-b border-white/8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_0%,rgba(45,212,191,0.14),transparent_50%),radial-gradient(ellipse_at_90%_40%,rgba(20,90,100,0.18),transparent_40%)]"
        />
        <div className="relative mx-auto flex w-full max-w-5xl flex-col items-start px-4 py-14 sm:px-6 sm:py-20">
          <h1 className="max-w-2xl font-[family-name:var(--font-display)] text-5xl leading-[0.95] tracking-tight text-white sm:text-7xl">
            rank<span className="text-teal-300">.fish</span>
          </h1>
          <p className="mt-4 max-w-md text-base text-white/50 sm:text-lg">
            Pay to appear. Outbid to rise. Bigger money, bigger badge.
          </p>
          <div className="mt-8">
            <CreateListingDialog
              triggerSize="lg"
              triggerLabel="Get on the board"
              triggerClassName="bg-teal-300 px-6 text-[#041016] hover:bg-teal-200"
            />
          </div>
        </div>
      </section>

      <Leaderboard listings={listings} />
      <BadgeField listings={listings} />

      <footer className="border-t border-white/8 px-4 py-8 text-center text-xs text-white/30">
        rank.fish — hybrid pay-to-appear · payments by Polar
      </footer>
    </div>
  );
}
