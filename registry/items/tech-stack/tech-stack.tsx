/* eslint-disable @next/next/no-img-element -- Consumer-provided logos keep this registry component framework independent. */
"use client";

import { useRef, useState, type CSSProperties } from "react";
import { useInView, useReducedMotion, useReducedMotionConfig } from "motion/react";
import { Tooltip } from "radix-ui";
import { cn } from "@/lib/utils";

export type TechStackItem = {
  src: string;
  label: string;
  subtitle?: string;
  rotate?: number;
  contain?: boolean;
  /** Token-based classes such as bg-card or bg-ink. */
  className?: string;
};

export function TechStack({ items, size = 40, overlap = 8, expandedGap = 8, expandOnView = true, className }: {
  items: TechStackItem[];
  size?: number;
  overlap?: number;
  expandedGap?: number;
  expandOnView?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-20% 0px -35% 0px" });
  const preference = useReducedMotion();
  const configured = useReducedMotionConfig();
  const reduced = preference || configured;
  const [open, setOpen] = useState<string | null>(null);
  return (
    <Tooltip.Provider delayDuration={120}>
      <div ref={ref} role="group" aria-label="Built with" data-inview={expandOnView && inView} className={cn("group/stack flex max-w-full flex-wrap items-center gap-y-4 py-3 font-body", className)}
        style={{ width: items.length * size + Math.max(0, items.length - 1) * expandedGap, "--stack-overlap": `${-Math.max(0, overlap)}px`, "--stack-gap": `${expandedGap}px` } as CSSProperties}>
        {items.map((item, index) => (
          <Tooltip.Root key={item.label} open={open === item.label} onOpenChange={(next) => setOpen(next ? item.label : null)}>
            <Tooltip.Trigger asChild>
              <button type="button" aria-label={item.label} style={{ "--tile-angle": reduced ? "0deg" : `${item.rotate ?? (index % 2 ? 4 : -5)}deg`, zIndex: items.length - index } as CSSProperties}
                onClick={(event) => { event.preventDefault(); setOpen(item.label); }}
                className="relative flex shrink-0 flex-col items-center gap-1 rounded-inset text-ink transition-[margin,transform] duration-300 not-first:ml-(--stack-overlap) rotate-(--tile-angle) group-hover/stack:rotate-0 group-hover/stack:not-first:ml-(--stack-gap) group-focus-within/stack:rotate-0 group-focus-within/stack:not-first:ml-(--stack-gap) max-lg:group-data-[inview=true]/stack:rotate-0 max-lg:group-data-[inview=true]/stack:not-first:ml-(--stack-gap) focus-visible:z-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring motion-reduce:rotate-0 motion-reduce:transition-none">
                <img src={item.src} alt="" width={size} height={size} className={cn("block rounded-inset bg-card shadow-md", item.contain ? "object-contain p-0.5" : "object-cover", item.className)} style={{ width: size, height: size }} />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content sideOffset={8} collisionPadding={12} className="z-50 rounded-inset border border-rule bg-ink px-3 py-2 font-body text-[12px] text-on-solid shadow-lg">
                <span className="block font-medium">{item.label}</span>
                {item.subtitle ? <span className="block text-[11px] text-on-solid/70">{item.subtitle}</span> : null}
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        ))}
      </div>
    </Tooltip.Provider>
  );
}
