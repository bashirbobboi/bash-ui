/* eslint-disable @next/next/no-img-element -- Portable registry component; original artwork is passed as image props. */
"use client";

import { useReducedMotion, useReducedMotionConfig } from "motion/react";
import { cn } from "@/lib/utils";

export function DoodlePortrait({ src, alt, doodleSrc, doodleStillSrc, width = 240, height = 300, doodleSize = 200, showDoodles = true, className }: {
  src: string;
  alt: string;
  doodleSrc: string;
  /** A static frame for reduced motion. Animated decorations are hidden if omitted. */
  doodleStillSrc?: string;
  width?: number;
  height?: number;
  doodleSize?: number;
  showDoodles?: boolean;
  className?: string;
}) {
  const preference = useReducedMotion();
  const configured = useReducedMotionConfig();
  const reduced = preference || configured;
  const decoration = reduced ? doodleStillSrc : doodleSrc;
  return (
    <div className={cn("inline-block max-w-full px-9 py-12", className)} style={{ width: width + 72 }}>
      <div className="relative w-full" style={{ aspectRatio: `${width} / ${height}` }}>
        <img src={src} alt={alt} width={width} height={height} className="h-full w-full object-cover" />
        {showDoodles && decoration ? <>
          <picture className={cn("pointer-events-none absolute -top-[8%] -left-[30%] max-w-none dark:invert", !doodleStillSrc && "motion-reduce:hidden")} style={{ width: `${doodleSize / width * 100}%` }}>
            {doodleStillSrc ? <source media="(prefers-reduced-motion: reduce)" srcSet={doodleStillSrc} /> : null}
            <img src={decoration} alt="" aria-hidden="true" width={doodleSize} height={doodleSize} className="block w-full object-contain" />
          </picture>
          <picture className={cn("pointer-events-none absolute -right-[30%] -bottom-[8%] max-w-none rotate-180 dark:invert", !doodleStillSrc && "motion-reduce:hidden")} style={{ width: `${doodleSize / width * 100}%` }}>
            {doodleStillSrc ? <source media="(prefers-reduced-motion: reduce)" srcSet={doodleStillSrc} /> : null}
            <img src={decoration} alt="" aria-hidden="true" width={doodleSize} height={doodleSize} className="block w-full object-contain" />
          </picture>
        </> : null}
      </div>
    </div>
  );
}
