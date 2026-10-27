"use client";

import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type FunnelStage = { label: string; value: number; caption?: string };
export type FunnelChartProps = {
  data: readonly FunnelStage[];
  selectedIndex?: number;
  onStageChange?: (index: number) => void;
  showPercentage?: boolean;
  edges?: "curved" | "straight";
  footer?: ReactNode;
  className?: string;
};

const count = (value: number) => value.toLocaleString("en-GB");
const percent = (value: number, total: number) => total > 0 ? Math.round(value / total * 100) : 0;

/** Stage totals and the same held, symmetrical Bézier ribbon used in 180Connect. */
export function FunnelChart({ data, selectedIndex = 0, onStageChange, showPercentage = true, edges = "curved", footer, className }: FunnelChartProps) {
  if (!data.length) return null;
  const values = data.map((stage) => Number.isFinite(stage.value) ? Math.max(0, stage.value) : 0);
  const maximum = Math.max(...values, 1);
  const first = values[0];
  const positions = data.map((_, i) => data.length === 1 ? 500 : 90 + i * 840 / (data.length - 1));
  const summary = (stage: FunnelStage, i: number) => <>
    <span className={cn("flex items-center gap-2 text-sm font-medium", i === selectedIndex ? "text-ink" : "text-dim")}>
      {stage.label}{i === selectedIndex && <span aria-hidden="true" className="size-1.5 rounded-full bg-brand" />}
    </span>
    <span className="mt-3 flex flex-wrap items-baseline gap-2">
      <span className="text-4xl font-semibold tracking-[-0.06em] text-ink tabular-nums">{count(values[i])}</span>
      {i > 0 && <span className="text-xs text-ink tabular-nums">{percent(values[i], values[i - 1])}%</span>}
    </span>
    <span className="mt-2 block text-xs leading-relaxed text-faint">{stage.caption ?? (i > 0 ? `of ${count(values[i - 1])} ${data[i - 1].label.toLowerCase()}` : "")}</span>
  </>;

  return <section aria-label="Pipeline funnel" className={cn("@container w-full min-w-0 bg-card font-body text-ink", className)}>
    <div className="grid grid-cols-2 gap-x-5 gap-y-6 px-5 pt-4 pb-7 @lg:grid-cols-[repeat(var(--stage-count),minmax(0,1fr))] @lg:px-7" style={{ "--stage-count": data.length } as CSSProperties}>
      {data.map((stage, i) => onStageChange ? <button key={stage.label} type="button" aria-pressed={i === selectedIndex} onClick={() => onStageChange(i)} className="min-w-0 cursor-pointer rounded-inset text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lead">{summary(stage, i)}</button> : <div key={stage.label} className="min-w-0">{summary(stage, i)}</div>)}
    </div>
    <div className="relative h-44 @lg:h-60">
      <svg aria-hidden="true" viewBox="0 0 1000 240" preserveAspectRatio="none" className="absolute inset-0 size-full">
        {values.map((value, i) => {
          const start = i === 0 ? 0 : positions[i];
          const end = positions[i + 1] ?? 1000;
          const hold = i === 0 ? positions[0] : start;
          const h0 = value / maximum * 110;
          const h1 = (values[i + 1] ?? value) / maximum * 110;
          const bend = (end - hold) * 0.55;
          const path = edges === "straight"
            ? `M ${start} ${120-h0} L ${hold} ${120-h0} L ${end} ${120-h1} L ${end} ${120+h1} L ${hold} ${120+h0} L ${start} ${120+h0} Z`
            : `M ${start} ${120-h0} L ${hold} ${120-h0} C ${hold+bend} ${120-h0}, ${end-bend} ${120-h1}, ${end} ${120-h1} L ${end} ${120+h1} C ${end-bend} ${120+h1}, ${hold+bend} ${120+h0}, ${hold} ${120+h0} L ${start} ${120+h0} Z`;
          return <path key={data[i].label} d={path} fill="var(--brand)" fillOpacity={0.1} />;
        })}
        {positions.map((x, i) => <line key={data[i].label} x1={x} x2={x} y1="0" y2="240" stroke="var(--ink)" strokeOpacity={i === selectedIndex ? 0.4 : 0.1} />)}
      </svg>
      {showPercentage && positions.map((x, i) => <span key={data[i].label} className={cn("absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border px-3 py-1.5 text-xs font-medium tabular-nums shadow-md", i === selectedIndex ? "border-ink bg-ink text-on-solid" : "border-rule-soft bg-card text-ink")} style={{ left: `${Number((x / 10).toFixed(6))}%` }}>{percent(values[i], first)}%</span>)}
    </div>
    {footer != null && <div className="px-5 pt-3 pb-5 text-sm text-dim @lg:px-7">{footer}</div>}
  </section>;
}

export default FunnelChart;
