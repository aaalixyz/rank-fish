"use client";

import { cn } from "@/lib/utils";

type LevelSliderProps = {
  id?: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (level: number) => void;
  className?: string;
};

/** Accessible range input styled for light rank.fish dialogs. */
export function LevelSlider({
  id,
  value,
  min = 1,
  max = 100,
  onChange,
  className,
}: LevelSliderProps) {
  return (
    <input
      id={id}
      type="range"
      min={min}
      max={max}
      step={1}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={cn(
        "level-slider h-2 w-full cursor-pointer appearance-none rounded-full bg-neutral-200 accent-neutral-900",
        className
      )}
    />
  );
}
