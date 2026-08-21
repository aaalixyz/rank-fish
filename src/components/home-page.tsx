"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Listing } from "@/db/schema";
import { SiteHeader } from "@/components/site-header";
import { BadgeField } from "@/components/badge-field";

type HomePageProps = {
  listings: Listing[];
};

/**
 * Page 1 — locked 100vw × 100vh field. No scroll. Badges drift left → right.
 */
export function HomePage({ listings }: HomePageProps) {
  const router = useRouter();

  useEffect(() => {
    const id = window.setInterval(() => {
      router.refresh();
    }, 20_000);
    return () => window.clearInterval(id);
  }, [router]);

  // Lock page scroll while on the field
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
    <div className="dark relative h-[100dvh] w-screen overflow-hidden bg-[#05080c] text-white">
      <SiteHeader />
      <BadgeField listings={listings} />
    </div>
  );
}
