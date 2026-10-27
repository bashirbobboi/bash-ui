import Link from "next/link";
import type { Theme } from "@/themes/types";
import { PaletteStrip } from "./palette-strip";
import { SystemIcon } from "./item-icon";

const CARD =
  "group flex flex-col gap-3 rounded-2xl site-stage p-4 transition-[background-color,box-shadow] duration-150 hover:site-raised";

export function SystemCard({ theme }: { theme: Theme }) {
  return (
    <div className={`relative ${CARD}`}>
      <div className="flex items-center justify-between">
        <SystemIcon slug={theme.slug} />
        <span className="text-[11px] text-faint">{theme.project}</span>
      </div>
      <PaletteStrip theme={theme.slug} />
      <div className="space-y-1">
        <h3 className="text-[14px] leading-5 font-medium text-ink">
          <Link href={`/systems/${theme.slug}`} className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-ring">
            {theme.name}
          </Link>
        </h3>
        <p className="line-clamp-3 text-[13px] leading-5 text-dim">{theme.summary}</p>
      </div>
    </div>
  );
}

export function PageTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <header className="flex flex-col gap-3 pt-1">
      <h1 className="text-[clamp(28px,5vw,36px)] leading-[1.17] font-medium tracking-[-0.005em] text-ink">{title}</h1>
      {sub ? <p className="max-w-3xl text-[14px] leading-[22px] text-foreground">{sub}</p> : null}
    </header>
  );
}

export function SectionHeading({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="space-y-1">
        <h2 className="text-[15px] leading-5 font-medium text-ink">{title}</h2>
        {hint ? <p className="text-[13px] leading-5 text-dim">{hint}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="shrink-0 text-[13px] font-medium text-dim transition-colors hover:text-ink">
      {children}
    </Link>
  );
}
