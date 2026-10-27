"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { useReducedMotion, useReducedMotionConfig } from "motion/react";
import { contributionCalendar, type ContributionDay } from "./contribution-calendar";
import { cn } from "@/lib/utils";

export type { ContributionDay } from "./contribution-calendar";
const PALETTE = ["var(--activity-0)", "var(--activity-1)", "var(--activity-2)", "var(--activity-3)", "var(--activity-4)"];

export function GithubActivityChart({ data, label = "Contributions in the last year", watercolor = true, showTotal = true, showLegend = true, onDaySelect, className }: {
  data: ContributionDay[];
  label?: string;
  watercolor?: boolean;
  showTotal?: boolean;
  showLegend?: boolean;
  onDaySelect?: (day: ContributionDay) => void;
  className?: string;
}) {
  const id = useId();
  const preference = useReducedMotion();
  const configured = useReducedMotionConfig();
  const reduced = preference || configured;
  const [hover, setHover] = useState<string | null>(null);
  const { cells, months, weeks, total } = contributionCalendar(data);
  const selected = cells.find((day) => day.date === hover);
  const cell = 12;
  const step = 15;
  const width = Math.max(180, 40 + weeks * step);
  const height = 139;

  function moveFocus(event: KeyboardEvent<SVGRectElement>, index: number) {
    const delta = ({ ArrowRight: 7, ArrowLeft: -7, ArrowDown: 1, ArrowUp: -1 } as Record<string, number>)[event.key];
    if (delta === undefined && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? cells.length - 1 : Math.max(0, Math.min(cells.length - 1, index + delta));
    event.currentTarget.ownerSVGElement?.querySelector<SVGRectElement>(`[data-day-index="${next}"]`)?.focus();
  }

  return (
    <div className={cn("w-full space-y-3 font-body text-ink", className)}>
      <p className="text-[14px] font-semibold">{showTotal ? `${total.toLocaleString("en-GB")} ` : ""}{label}</p>
      {cells.length ? <div className="w-full overflow-x-auto pb-1">
        <svg viewBox={`0 0 ${width} ${height}`} className="block h-auto min-w-[540px] w-full" aria-label={`${label}: ${total.toLocaleString("en-GB")} contributions`}>
          <defs>
            <filter id={`${id}-paint`} x="-15%" y="-15%" width="130%" height="130%">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.2" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
          {watercolor ? <g aria-hidden="true">
            {Array.from({ length: 38 }, (_, index) => <circle key={index} cx={(index * 93 + 17) % width} cy={(index * 31 + 9) % height} r={0.5 + index % 4 * 0.5} fill={PALETTE[index % 4 + 1]} opacity={0.1} />)}
          </g> : null}
          <g className="fill-dim font-body text-[9px]" aria-hidden="true">
            {months.map((month) => <text key={month.column} x={32 + month.column * step} y={14}>{month.label}</text>)}
            {["", "Mon", "", "Wed", "", "Fri", ""].map((day, index) => day ? <text key={day} x={26} y={22 + index * step + 10} textAnchor="end">{day}</text> : null)}
          </g>
          <g filter={watercolor ? `url(#${id}-paint)` : undefined}>
            {cells.map((day, index) => {
              const x = 32 + day.column * step;
              const y = 22 + day.row * step;
              const text = `${day.count} contribution${day.count === 1 ? "" : "s"} on ${day.date}`;
              return <rect key={day.date} x={x} y={y} width={cell} height={cell} rx={2}
                fill={PALETTE[day.level]} opacity={day.level === 0 ? 0.55 : 0.9}
                transform={watercolor && !reduced ? `rotate(${index * 13 % 7 - 3} ${x + 6} ${y + 6})` : undefined}
                role="button" tabIndex={hover === day.date || (!hover && index === 0) ? 0 : -1} data-day-index={index} aria-label={text}
                aria-describedby={hover === day.date ? `${id}-description` : undefined}
                className="cursor-pointer focus:outline-2 focus:outline-offset-2 focus:outline-ring"
                onPointerEnter={() => setHover(day.date)} onPointerLeave={() => setHover(null)} onFocus={() => setHover(day.date)} onBlur={() => setHover(null)}
                onClick={() => { setHover(day.date); onDaySelect?.(day); }}
                onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onDaySelect?.(day); } else if (event.key === "Escape") setHover(null); else moveFocus(event, index); }}>
                <title>{text}</title>
              </rect>;
            })}
          </g>
          {selected ? (() => {
            const text = `${selected.count} contribution${selected.count === 1 ? "" : "s"} on ${selected.date}`;
            const tooltipWidth = Math.min(width - 4, text.length * 4.6 + 16);
            const x = Math.max(2, Math.min(32 + selected.column * step - tooltipWidth / 2, width - tooltipWidth - 2));
            const y = selected.row < 2 ? 22 + selected.row * step + 18 : 22 + selected.row * step - 26;
            return <g pointerEvents="none" aria-hidden="true"><rect x={x} y={y} width={tooltipWidth} height={22} rx={4} className="fill-ink" /><text x={x + tooltipWidth / 2} y={y + 14} textAnchor="middle" className="fill-on-solid font-body text-[9px]">{text}</text></g>;
          })() : null}
        </svg>
      </div> : <p className="py-6 text-[13px] text-dim">No activity to show.</p>}
      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-dim">
        <span id={`${id}-description`} role="status">{selected ? `${selected.date}: ${selected.count} contribution${selected.count === 1 ? "" : "s"}` : "Select a day to inspect its activity."}</span>
        {showLegend ? <span className="inline-flex items-center gap-1.5"><span>Less</span>{PALETTE.map((colour, index) => <span key={colour} aria-hidden="true" className="size-3 rounded-[2px]" style={{ background: colour, opacity: index === 0 ? 0.55 : 0.9 }} />)}<span>More</span></span> : null}
      </div>
    </div>
  );
}
