"use client";

import { useId, useMemo, useState } from "react";
import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";
import {
  ACCENTS,
  EASE,
  formatCompact,
  formatPointDate,
  MetricChart,
  SERIES_COLORS,
  type ChartSeries,
  type ChartView,
  type MetricAccent,
  type MetricSeries,
  type SeriesPoint,
} from "./metric-chart";
import { PeriodSelect, ViewToggle, type PeriodOption } from "./metric-controls";

// Re-exported so consumers import this file only.
export type { SeriesPoint, MetricSeries, MetricAccent, ChartView, PeriodOption };

export type FooterStat = { label: string; value: number | string };

export type CardSize = "sm" | "md" | "lg";

export interface MetricCardProps {
  title: string;
  /** The headline. Defaults to the compact sum of the visible primary series. */
  total?: string | number;
  /** Footer delta. Defaults to the change between the last two points. */
  delta?: string;
  deltaLabel?: string;
  /** Trend badge. Defaults to the % change across the window (or a count from zero). */
  percent?: string;
  /** Forces the trend direction; otherwise read from first vs last point. */
  trend?: "up" | "down";
  /** Appended to exact values in the tooltip ("1,204 clients"). */
  unit?: string;
  /** Label of the period selected at first render. */
  period?: string;
  periodOptions?: PeriodOption[];
  onPeriodChange?: (option: PeriodOption) => void;
  defaultView?: ChartView;
  /** Fixed colour. Omit to colour by direction: go up, stop down, neutral flat. */
  accent?: MetricAccent;
  /** Single series. Supply this OR `series`. */
  data?: SeriesPoint[];
  /** Several named series. Takes priority over `data`. */
  series?: MetricSeries[];
  /** Point the cursor rests on when nothing is hovered. Default: the last. */
  defaultIndex?: number;
  size?: CardSize;
  /** Show the secondary stats in the footer. */
  showStats?: boolean;
  /**
   * Replaces peak / low / avg on the right of the footer.
   * - "series": the sum of every series after the first.
   * - FooterStat[]: an explicit list.
   * - function: derived from the windowed series.
   */
  footerStats?: "series" | FooterStat[] | ((visibleSeries: MetricSeries[]) => FooterStat[]);
  showDelta?: boolean;
  /** False hides the footer bar entirely. */
  showFooter?: boolean;
  showAxes?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  /** Offer a "Custom range" calendar step in the period dropdown. */
  allowCustomRange?: boolean;
  /** Value formatting. Default: compact in the headline, exact in the tooltip. */
  valueFormatter?: (value: number) => string;
  dateFormatter?: (date: string) => string;
  loading?: boolean;
  /** Chart and dot grid span the whole card instead of its right 62%. */
  fullWidth?: boolean;
  /** Empty-state copy, shown when the window holds fewer than two points. */
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

const DEFAULT_PERIODS: PeriodOption[] = [
  { label: "Past 7 days", points: 7 },
  { label: "Past 14 days", points: 14 },
  { label: "Past 30 days" },
];

// Share of the card (from the right) the chart region occupies.
const REGION_W = 62; // %
// A change under this reads as "stable" → neutral accent.
const NEUTRAL_PCT = 0.5;

const SIZES: Record<
  CardSize,
  { minH: string; pad: string; footer: string; title: string; headline: string; headlineH: string }
> = {
  sm: {
    minH: "min-h-[220px] sm:min-h-[260px]",
    pad: "px-5 pt-5 sm:px-6",
    footer: "px-5 py-3 sm:px-6",
    title: "text-[15px]",
    headline: "text-[38px] sm:text-[46px]",
    headlineH: "h-[38px] sm:h-[46px]",
  },
  md: {
    minH: "min-h-[300px] sm:min-h-[380px]",
    pad: "px-5 pt-6 sm:px-8 sm:pt-7",
    footer: "px-5 py-3 sm:px-8 sm:py-4",
    title: "text-[16px] sm:text-[17px]",
    headline: "text-[46px] sm:text-[72px]",
    headlineH: "h-[46px] sm:h-[72px]",
  },
  lg: {
    minH: "min-h-[320px] sm:min-h-[460px]",
    pad: "px-5 pt-6 sm:px-10 sm:pt-9",
    footer: "px-5 py-4 sm:px-10 sm:py-5",
    title: "text-[26px] sm:text-[29px]",
    headline: "text-[48px] sm:text-[88px]",
    headlineH: "h-12 sm:h-[88px]",
  },
};

/**
 * Trim a series to the selected window. A preset (`points`) keeps the trailing
 * N points; explicit `from`/`to` filter inclusively and win over `points`.
 */
const sliceWindow = (points: SeriesPoint[], n?: number, from?: string, to?: string) => {
  let out = points;
  if (from) out = out.filter((p) => p.date >= from);
  if (to) out = out.filter((p) => p.date <= to);
  if (!from && !to && n && n < out.length) out = out.slice(-n);
  return out;
};

const DOT_MASK_FULL = "linear-gradient(to right, transparent 2%, black 15%, black 85%, transparent 98%)";
const DOT_MASK_REGION = "linear-gradient(to right, transparent, black 55%)";

export function MetricCard({
  title,
  total,
  delta,
  deltaLabel = "today",
  percent,
  trend,
  unit,
  period = "Past 30 days",
  periodOptions,
  onPeriodChange,
  defaultView = "curve",
  accent,
  data,
  series,
  defaultIndex,
  size = "md",
  showStats = true,
  footerStats: footerStatsProp,
  showDelta = true,
  showFooter = true,
  showAxes = false,
  showXAxis,
  showYAxis,
  allowCustomRange = false,
  valueFormatter,
  dateFormatter,
  loading = false,
  fullWidth = false,
  emptyTitle = "No data yet",
  emptyDescription = "Metrics will appear once data is available.",
  className,
}: MetricCardProps) {
  const uid = useId().replace(/:/g, "");
  const gridId = `grid-${uid}`;
  const regionWidth = fullWidth ? "100%" : `${REGION_W}%`;
  const hasFooter = showFooter && (showDelta || showStats);
  const sz = SIZES[size];
  const shell = cn(
    "relative flex w-full flex-col rounded-panel border border-rule bg-card font-body shadow-sm",
    sz.minH,
    className,
  );

  const periods = periodOptions ?? DEFAULT_PERIODS;
  // The whole option is kept (not just its label): an applied custom range is
  // not one of the presets and carries its own from/to.
  const defaultPeriod = periods.find((p) => p.label === period) ?? periods[periods.length - 1];
  const [selected, setSelected] = useState<PeriodOption>(() => defaultPeriod);
  const [view, setView] = useState<ChartView>(defaultView);

  const baseSeries: MetricSeries[] = useMemo(
    () => (series?.length ? series : [{ name: title, data: data ?? [], accent }]),
    [series, data, title, accent],
  );

  const visibleSeries = useMemo(
    () =>
      baseSeries.map((s) => ({
        ...s,
        data: sliceWindow(s.data, selected.points, selected.from, selected.to),
      })),
    [baseSeries, selected],
  );

  // Calendar bounds from the UNWINDOWED series, so the window can widen again.
  const seriesBounds = useMemo(() => {
    let min: string | null = null;
    let max: string | null = null;
    for (const entry of baseSeries) {
      for (const point of entry.data) {
        if (min === null || point.date < min) min = point.date;
        if (max === null || point.date > max) max = point.date;
      }
    }
    return { min, max };
  }, [baseSeries]);

  const primary = visibleSeries[0];
  const isMulti = visibleSeries.length > 1;
  const hasData = (primary?.data.length ?? 0) >= 2;

  // Every figure derives from the primary series, so the card stays coherent
  // across a period change. Explicit props still win.
  const stats = useMemo(() => {
    const vals = primary?.data.map((d) => d.value) ?? [];
    const sum = vals.reduce((a, b) => a + b, 0);
    const first = vals[0] ?? 0;
    const last = vals[vals.length - 1] ?? 0;
    const prev = vals[vals.length - 2] ?? first;
    const net = last - first;
    return {
      sum,
      net,
      first,
      pct: first ? (net / first) * 100 : 0,
      step: last - prev,
      peak: vals.length ? Math.max(...vals) : 0,
      low: vals.length ? Math.min(...vals) : 0,
      avg: vals.length ? sum / vals.length : 0,
    };
  }, [primary]);

  const resolvedFooterStats = useMemo<FooterStat[]>(() => {
    if (Array.isArray(footerStatsProp)) return footerStatsProp;
    if (typeof footerStatsProp === "function") return footerStatsProp(visibleSeries);
    if (footerStatsProp === "series") {
      return visibleSeries.slice(1).map((s) => ({
        label: s.footerLabel ?? s.name.toLowerCase(),
        value: s.data.reduce((acc, point) => acc + point.value, 0),
      }));
    }
    return [];
  }, [footerStatsProp, visibleSeries]);

  // A window starting at zero has no percentage to quote, so it states a count.
  const fromZero = stats.first === 0 && stats.net !== 0;

  const resolvedTrend: "up" | "down" | "flat" =
    trend ??
    (fromZero
      ? stats.net >= 0
        ? "up"
        : "down"
      : Math.abs(stats.pct) < NEUTRAL_PCT
        ? "flat"
        : stats.net >= 0
          ? "up"
          : "down");
  const resolvedAccent: MetricAccent =
    accent ?? (resolvedTrend === "up" ? "go" : resolvedTrend === "down" ? "stop" : "neutral");
  const color = ACCENTS[resolvedAccent];
  const TrendIcon = resolvedTrend === "flat" ? ArrowRight : resolvedTrend === "down" ? ArrowDown : ArrowUp;

  const fmtCompact = valueFormatter ?? formatCompact;
  const fmtFull = valueFormatter ?? ((n: number) => n.toLocaleString() + (unit ? ` ${unit}` : ""));
  const fmtDate = dateFormatter ?? formatPointDate;
  const sign = (n: number) => (n >= 0 ? "+" : "−") + fmtCompact(Math.abs(n));

  const displayTotal = total ?? fmtCompact(stats.sum);
  const displayDelta = delta ?? sign(stats.step);
  const displayPercent = percent ?? (fromZero ? sign(stats.net) : `${Math.abs(stats.pct).toFixed(1)}%`);

  // Each series' colour: explicit colour → accent → palette → the headline colour.
  const chartSeries: ChartSeries[] = visibleSeries.map((s, i) => ({
    name: s.name,
    data: s.data,
    color:
      s.color ??
      (s.accent ? ACCENTS[s.accent].stroke : isMulti ? SERIES_COLORS[i % SERIES_COLORS.length] : color.stroke),
  }));

  const lastIndex = (primary?.data.length ?? 1) - 1;
  const fallback = Math.min(defaultIndex ?? lastIndex, lastIndex);

  const handlePeriodChange = (option: PeriodOption) => {
    setSelected(option);
    onPeriodChange?.(option);
  };

  if (loading) {
    // The loaded card's own layout, bar for bar. The title bar holds the real
    // string invisibly, so a wrapped title reserves exactly its lines.
    return (
      <div className={shell} aria-busy="true">
        <div className={`relative z-20 flex flex-1 flex-col ${sz.pad}`}>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div className="flex min-w-0 items-center gap-3">
              <span className={`block w-fit max-w-full animate-pulse rounded bg-muted ${sz.title}`}>
                <span className="invisible select-none">{title}</span>
              </span>
              <span className="block h-[30px] w-16 shrink-0 animate-pulse rounded-full bg-muted" />
            </div>
            <div className="flex items-center gap-3.5">
              <span className="block h-4 w-16 animate-pulse rounded bg-muted" />
              <span className="block h-7 w-28 animate-pulse rounded-full bg-muted" />
            </div>
          </div>
          <span className={`mt-5 block w-fit max-w-full animate-pulse rounded-lg bg-muted ${sz.headlineH}`}>
            <span className="invisible leading-none select-none">000</span>
          </span>
          <div className="mt-auto h-24 w-full animate-pulse rounded-lg bg-muted/50" />
        </div>
        {hasFooter && (
          <div
            className={`relative z-10 flex items-center justify-between gap-4 rounded-b-[inherit] border-t border-rule-soft bg-card ${sz.footer}`}
          >
            <span className="block h-4 w-32 animate-pulse rounded bg-muted" />
            <span className="block h-4 w-40 animate-pulse rounded bg-muted" />
          </div>
        )}
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className={shell}>
        <div className={`flex flex-1 flex-col ${sz.pad}`}>
          <h3 className={`${sz.title} font-semibold tracking-tight text-foreground`}>{title}</h3>
          <div className="flex flex-1 flex-col items-center justify-center gap-1 py-10 text-center">
            <p className="text-sm font-medium text-foreground">{emptyTitle}</p>
            <p className="text-xs text-muted-foreground">{emptyDescription}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={shell}>
      {/* Plot area: a sibling of the footer, so the chart's floor lands on the
          footer's top border instead of behind it. */}
      <div
        className={cn(
          "relative flex min-h-0 flex-1 flex-col rounded-t-[inherit]",
          !hasFooter && "rounded-b-[inherit]",
        )}
      >
        {/* Clipped background (wash + dot grid), inheriting the card's radius,
            so the outer shell can stay overflow-visible for the dropdown. */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
          <div className="absolute inset-y-0 right-0" style={{ width: regionWidth }}>
            <div
              className="absolute inset-0"
              style={{
                background: fullWidth
                  ? `linear-gradient(to top, color-mix(in oklab, ${color.stroke} 9.4%, transparent), transparent 75%)`
                  : `linear-gradient(to left, color-mix(in oklab, ${color.stroke} 12.2%, transparent), transparent 75%)`,
              }}
            />
            <div
              className="absolute inset-0 text-faint"
              style={{
                WebkitMaskImage: fullWidth ? DOT_MASK_FULL : DOT_MASK_REGION,
                maskImage: fullWidth ? DOT_MASK_FULL : DOT_MASK_REGION,
              }}
            >
              <svg className="h-full w-full" aria-hidden>
                <defs>
                  <pattern id={gridId} width="14" height="14" patternUnits="userSpaceOnUse">
                    <circle cx="1" cy="1" r="1" fill="currentColor" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill={`url(#${gridId})`} />
              </svg>
            </div>
          </div>
        </div>

        {/* Chart region: overflow-visible so the tooltip is never clipped. */}
        <div
          className="absolute inset-y-0 right-0 overflow-visible rounded-r-[inherit]"
          style={{ width: regionWidth }}
        >
          <MetricChart
            series={chartSeries}
            view={view}
            defaultIndex={fallback}
            valueFormatter={fmtFull}
            dateFormatter={fmtDate}
            compactFormatter={fmtCompact}
            bandTop={fullWidth ? 42 : undefined}
            showAxes={showAxes}
            showXAxis={showXAxis}
            showYAxis={showYAxis}
            className="rounded-r-[inherit]"
          />
        </div>

        <div
          className={cn(
            "pointer-events-none relative z-20 flex flex-1 flex-col",
            sz.pad,
            !hasFooter && (size === "lg" ? "pb-9" : size === "md" ? "pb-7" : "pb-5"),
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div className="flex min-w-0 items-center gap-3">
              <h3 className={`${sz.title} font-semibold tracking-tight text-foreground`}>{title}</h3>
              <ViewToggle value={view} onChange={setView} layoutId={`view-toggle-${uid}`} />
            </div>
            <div className="flex items-center gap-3.5 text-[14px]">
              <motion.span
                key={`trend-${selected.label}`}
                initial={{ opacity: 0, y: -3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={cn(
                  "flex items-center gap-1 whitespace-nowrap rounded-full bg-card/70 px-2.5 py-1 font-semibold tabular-nums backdrop-blur-sm",
                  resolvedTrend === "up" ? "text-go" : resolvedTrend === "down" ? "text-stop" : "text-dim",
                )}
              >
                <TrendIcon size={16} strokeWidth={2.5} />
                {displayPercent}
              </motion.span>
              <PeriodSelect
                value={selected.label}
                options={periods}
                onChange={handlePeriodChange}
                accentText={color.text}
                allowCustomRange={allowCustomRange}
                defaultOption={defaultPeriod}
                rangeMin={seriesBounds.min}
                rangeMax={seriesBounds.max}
              />
            </div>
          </div>

          {isMulti && (
            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1">
              {chartSeries.map((s) => (
                <span key={s.name} className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                  <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                  {s.name}
                </span>
              ))}
            </div>
          )}

          <motion.div
            key={`headline-${selected.label}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className={`mt-5 ${sz.headline} font-medium leading-none tracking-tight text-foreground tabular-nums`}
          >
            {displayTotal}
          </motion.div>
        </div>
      </div>

      {hasFooter && (
        <div
          className={`relative z-10 flex items-center justify-between gap-4 rounded-b-[inherit] border-t border-rule-soft bg-card text-[14px] ${sz.footer}`}
        >
          {showDelta && (
            <div>
              <motion.span
                key={`delta-${selected.label}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25 }}
                className="font-medium"
                style={{ color: color.text }}
              >
                {displayDelta}
              </motion.span>{" "}
              <span className="text-muted-foreground">{deltaLabel}</span>
            </div>
          )}
          {showStats && (
            <motion.div
              key={`stats-${selected.label}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="ml-auto flex items-center gap-2.5 text-[12px] text-muted-foreground"
            >
              {(resolvedFooterStats.length > 0
                ? resolvedFooterStats
                : [
                    { label: "peak", value: stats.peak },
                    { label: "low", value: stats.low },
                    { label: "avg", value: Math.round(stats.avg) },
                  ]
              ).map((stat, idx) => (
                <span key={stat.label} className="flex items-center gap-2.5">
                  {idx > 0 && <span className="opacity-40">·</span>}
                  <span>
                    <span className="font-medium text-ink">
                      {typeof stat.value === "number" ? fmtCompact(stat.value) : stat.value}
                    </span>{" "}
                    {stat.label}
                  </span>
                </span>
              ))}
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}

export default MetricCard;
