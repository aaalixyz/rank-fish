"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { CreateListingDialog } from "@/components/create-listing-dialog";
import { isDemoLogoDoubleClick, useDemoMode } from "@/components/demo-mode";
import type { EconomySnapshot } from "@/lib/pricing";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Field" },
  { href: "/rank", label: "Rank" },
] as const;

type SiteHeaderProps = {
  economy?: EconomySnapshot;
};

export function SiteHeader({ economy }: SiteHeaderProps) {
  const pathname = usePathname();
  const demo = useDemoMode();

  function onLogoClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (!isDemoLogoDoubleClick()) return;
    e.preventDefault();
    demo.toggle();
  }

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-30">
      <div className="pointer-events-auto mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <motion.div
          className="flex min-w-0 items-center gap-4 sm:gap-8"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <Link
            href="/"
            onClick={onLogoClick}
            onDoubleClick={(e) => e.preventDefault()}
            className="select-none font-[family-name:var(--font-display)] text-xl tracking-tight text-neutral-900 sm:text-2xl"
            title={demo.active ? "Demo board on — click twice to leave" : undefined}
          >
            rank<span className={demo.active ? "text-amber-600" : "text-neutral-400"}>.fish</span>
            {demo.active ? (
              <span className="ml-2 align-middle text-[10px] font-sans font-medium tracking-[0.18em] text-amber-700 uppercase">
                demo
              </span>
            ) : null}
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            {NAV.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-2 py-1 text-xs tracking-[0.14em] uppercase transition sm:text-[11px]",
                    active
                      ? "text-neutral-900"
                      : "text-neutral-400 hover:text-neutral-700"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
        >
          <CreateListingDialog
            economy={economy}
            triggerLabel="Add link"
            triggerSize="sm"
          />
        </motion.div>
      </div>
    </header>
  );
}
