"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Listing } from "@/db/schema";
import { SiteHeader } from "@/components/site-header";
import { BadgeField } from "@/components/badge-field";
import type { EconomySnapshot } from "@/lib/pricing";

type HomePageProps = {
  listings: Listing[];
  economy: EconomySnapshot;
};

export function HomePage({ listings, economy }: HomePageProps) {
  const router = useRouter();

  useEffect(() => {
    const id = window.setInterval(() => {
      router.refresh();
    }, 20_000);
    return () => window.clearInterval(id);
  }, [router]);

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
      <SiteHeader economy={economy} />
      <BadgeField listings={listings} />
    </div>
  );
}
