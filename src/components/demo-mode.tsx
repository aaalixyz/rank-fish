"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  DEMO_ECONOMY,
  DEMO_LISTINGS,
  DEMO_LOGO_CLICK_KEY,
  DEMO_LOGO_CLICK_MS,
  DEMO_STORAGE_KEY,
  type DemoListing,
} from "@/lib/demo-data";
import type { EconomySnapshot } from "@/lib/pricing";

type DemoModeValue = {
  active: boolean;
  listings: DemoListing[];
  economy: EconomySnapshot;
  toggle: () => void;
};

const DemoModeContext = createContext<DemoModeValue | null>(null);

const listeners = new Set<() => void>();

let lastLogoClickAt = 0;

function emit() {
  listeners.forEach((listener) => listener());
}

/** True when this click completes a pair within 1s (survives header remounts). */
export function isDemoLogoDoubleClick(now = Date.now()): boolean {
  let stored = 0;
  try {
    stored = Number(sessionStorage.getItem(DEMO_LOGO_CLICK_KEY) || 0);
  } catch {
    stored = 0;
  }
  const prev = Math.max(lastLogoClickAt, stored);
  const hit = prev > 0 && now - prev < DEMO_LOGO_CLICK_MS;
  lastLogoClickAt = hit ? 0 : now;
  try {
    if (hit) sessionStorage.removeItem(DEMO_LOGO_CLICK_KEY);
    else sessionStorage.setItem(DEMO_LOGO_CLICK_KEY, String(now));
  } catch {
    // sessionStorage can throw in private mode
  }
  return hit;
}

function readStored(): boolean {
  try {
    return sessionStorage.getItem(DEMO_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeStored(active: boolean) {
  try {
    if (active) sessionStorage.setItem(DEMO_STORAGE_KEY, "1");
    else sessionStorage.removeItem(DEMO_STORAGE_KEY);
  } catch {
    // sessionStorage can throw in private mode
  }
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const active = useSyncExternalStore(subscribe, readStored, () => false);

  const toggle = useCallback(() => {
    writeStored(!readStored());
  }, []);

  const value = useMemo(
    () => ({
      active,
      listings: DEMO_LISTINGS,
      economy: DEMO_ECONOMY,
      toggle,
    }),
    [active, toggle]
  );

  return (
    <DemoModeContext.Provider value={value}>{children}</DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  const ctx = useContext(DemoModeContext);
  if (!ctx) {
    throw new Error("useDemoMode must be used within DemoModeProvider");
  }
  return ctx;
}
