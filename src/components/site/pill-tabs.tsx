"use client";

import { motion, useReducedMotionConfig } from "motion/react";
import { useId } from "react";
import { cn } from "@/lib/utils";

export type PillTab<T extends string> = { value: T; label: string };

/**
 * A row of pills where only the selected one has a fill, and the fill slides
 * between them. No bar behind them: the libraries.dev detail-tab recipe.
 */
export function PillTabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
  size = "md",
  className,
}: {
  tabs: PillTab<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const layoutId = useId();
  const reduce = useReducedMotionConfig();

  return (
    <div role="tablist" aria-label={label} className={cn("flex items-center rounded-full p-[3px]", className)}>
      {tabs.map((tab) => {
        const selected = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.value)}
            className={cn(
              "relative shrink-0 rounded-full font-medium whitespace-nowrap transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dim",
              size === "md" ? "h-[30px] px-3 text-[13px]" : "h-7 px-2.5 text-[12px]",
              selected ? "text-ink" : "text-dim hover:text-ink",
            )}
          >
            {selected ? (
              <motion.span
                layoutId={layoutId}
                className="site-raised absolute inset-0 rounded-full"
                transition={reduce ? { duration: 0 } : { duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              />
            ) : null}
            <span className="relative">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
