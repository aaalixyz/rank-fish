"use client";

import { PILL_THEME_LIST, type PillThemeId } from "@/lib/pill-themes";
import { cn } from "@/lib/utils";

type ThemePickerProps = {
  value: PillThemeId;
  onChange: (id: PillThemeId) => void;
};

export function ThemePicker({ value, onChange }: ThemePickerProps) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-xs uppercase tracking-[0.16em] text-neutral-400">
        Pill
      </legend>
      <div className="grid grid-cols-4 gap-1.5">
        {PILL_THEME_LIST.map((theme) => {
          const selected = theme.id === value;
          return (
            <button
              key={theme.id}
              type="button"
              title={theme.hint}
              aria-pressed={selected}
              onClick={() => onChange(theme.id)}
              className={cn(
                "rounded-lg border px-1 py-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20",
                selected
                  ? "border-neutral-900 bg-white"
                  : "border-transparent hover:border-neutral-200"
              )}
            >
              <span
                className="mx-auto flex h-6 max-w-full items-center justify-center truncate rounded-full border px-2 text-[10px] font-medium tracking-tight"
                style={{
                  background: theme.bg,
                  color: theme.fg,
                  borderColor: theme.outline,
                }}
              >
                {theme.label}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
