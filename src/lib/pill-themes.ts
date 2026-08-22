/**
 * Eight poster-style pill themes for field badges.
 * Flat fill + 1px outline, tuned for the paper field (#f7f6f3).
 */

export const PILL_THEME_IDS = [
  "ink",
  "terminal",
  "paper",
  "brick",
  "citrus",
  "signal",
  "violet",
  "matcha",
] as const;

export type PillThemeId = (typeof PILL_THEME_IDS)[number];

export type PillTheme = {
  id: PillThemeId;
  label: string;
  hint: string;
  bg: string;
  fg: string;
  outline: string;
};

export const DEFAULT_PILL_THEME: PillThemeId = "paper";

export const PILL_THEMES: Record<PillThemeId, PillTheme> = {
  ink: {
    id: "ink",
    label: "Ink",
    hint: "Black fill, bone type",
    bg: "#141414",
    fg: "#f4f1ea",
    outline: "#2e2e2e",
  },
  terminal: {
    id: "terminal",
    label: "Terminal",
    hint: "Black + IT green",
    bg: "#0b0f0b",
    fg: "#3dff6e",
    outline: "#1c3d28",
  },
  paper: {
    id: "paper",
    label: "Paper",
    hint: "Minimal white",
    bg: "#ffffff",
    fg: "#171717",
    outline: "rgba(23, 23, 23, 0.16)",
  },
  brick: {
    id: "brick",
    label: "Brick",
    hint: "Brick red",
    bg: "#9b2c1a",
    fg: "#f8efe8",
    outline: "#7a2013",
  },
  citrus: {
    id: "citrus",
    label: "Citrus",
    hint: "Orange design",
    bg: "#f15a24",
    fg: "#1a0800",
    outline: "#c44716",
  },
  signal: {
    id: "signal",
    label: "Signal",
    hint: "Blue #0000FF",
    bg: "#0000ff",
    fg: "#ffffff",
    outline: "#0000c8",
  },
  violet: {
    id: "violet",
    label: "Violet",
    hint: "Deep violet",
    bg: "#5b21b6",
    fg: "#f5f0ff",
    outline: "#4c1d95",
  },
  matcha: {
    id: "matcha",
    label: "Matcha",
    hint: "Forest green",
    bg: "#1a3c2a",
    fg: "#d8f3dc",
    outline: "#143023",
  },
};

export const PILL_THEME_LIST: PillTheme[] = PILL_THEME_IDS.map(
  (id) => PILL_THEMES[id]
);

export function isPillThemeId(value: string): value is PillThemeId {
  return (PILL_THEME_IDS as readonly string[]).includes(value);
}

export function resolvePillTheme(
  value: string | null | undefined
): PillTheme {
  if (value && isPillThemeId(value)) return PILL_THEMES[value];
  return PILL_THEMES[DEFAULT_PILL_THEME];
}
