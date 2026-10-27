/* eslint-disable @next/next/no-img-element -- Portable registry component; images are supplied by the consumer. */
"use client";

import { cn } from "@/lib/utils";

export type SocialLink = { label: string; href: string; src: string; sizeScale?: number };

export function SocialLinks({ links, size = 80, gap = 40, showLabels = false, newWindow = true, className }: {
  links: SocialLink[];
  size?: number;
  gap?: number;
  showLabels?: boolean;
  newWindow?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center justify-center font-body", className)} style={{ gap }}>
      {links.map((link) => (
        <a key={link.label} href={link.href} target={newWindow ? "_blank" : undefined} rel={newWindow ? "noopener noreferrer" : undefined}
          aria-label={`${link.label}${newWindow ? " (opens in a new tab)" : ""}`}
          className="flex min-h-11 min-w-11 flex-col items-center justify-center gap-1 rounded-inset text-ink transition-transform duration-200 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring motion-reduce:transform-none motion-reduce:transition-none">
          <img src={link.src} alt="" width={size * (link.sizeScale ?? 1)} height={size * (link.sizeScale ?? 1)} className="max-w-full object-contain" style={{ height: size * (link.sizeScale ?? 1), width: "auto", maxWidth: size * (link.sizeScale ?? 1) * 2.5 }} />
          {showLabels ? <span className="text-[12px]">{link.label}</span> : null}
        </a>
      ))}
    </div>
  );
}
