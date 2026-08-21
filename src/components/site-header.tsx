"use client";

import { motion } from "framer-motion";
import { CreateListingDialog } from "@/components/create-listing-dialog";

export function SiteHeader() {
  return (
    <header className="relative z-20 border-b border-white/8 bg-[#060a0f]/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <motion.a
          href="/"
          className="group flex items-baseline gap-2"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <span className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-white sm:text-3xl">
            rank
            <span className="text-teal-300">.fish</span>
          </span>
        </motion.a>

        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
        >
          <CreateListingDialog />
        </motion.div>
      </div>
    </header>
  );
}
