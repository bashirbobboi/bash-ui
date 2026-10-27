"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotionConfig } from "motion/react";

import { cn } from "@/lib/utils";

/** One point on a metric line: a value and the label for its x position. */
export type SeriesPoint = { value: number; date: string };

/**
 * The card's accent. `go`, `stop` and `neutral` are the up / down / flat
 * signals the card derives from the data itself; `brand` and `lead` let a card
 * opt into a fixed colour instead.
 */
export type MetricAccent = "go" | "stop" | "neutral" | "brand" | "lead";

/** A named series, optionally pinned to its own accent or any CSS colour. */
export type MetricSeries = {
  name: string;
  data: SeriesPoint[];
  accent?: MetricAccent;
  /** Any CSS colour; wins over `accent`. Keep it a token (`var(--hold)`). */
  color?: string;
  /** What the footer calls this series' sum when `footerStats="series"`. */
  footerLabel?: string;
};

export type ChartView = "curve" | "bars";

/** What MetricChart actually draws: a series whose colour is already resolved. */
export type ChartSeries = { name: string; data: SeriesPoint[]; color: string };

export const ACCENTS: Record<MetricAccent, { stroke: string; text: string }> = {
  go: { stroke: "var(--go)", text: "var(--go)" },
  stop: { stroke: "var(--stop)", text: "var(--stop)" },
  neutral: { stroke: "var(--muted-foreground)", text: "var(--muted-foreground)" },
  // Brand is a mark colour; as text it is pulled toward ink so it still reads.
  brand: { stroke: "var(--brand)", text: "color-mix(in oklab, var(--brand) 78%, var(--ink))" },
  lead: { stroke: "var(--lead)", text: "var(--lead)" },
};

/** Cycled through when a card draws more than one series and none set a colour. */
export const SERIES_COLORS = [
  "var(--lead)",
  "var(--go)",
  "var(--hold)",
  "var(--stop)",
  "var(--faint)",
];

export const EASE = [0.2, 0.7, 0.2, 1] as const;

/** Spelled out rather than `Intl`: runtimes disagree on "Sep" vs "Sept". */
export const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** An ISO day becomes "15 Aug, 2026"; anything else is already a label. */
export function formatPointDate(date: string): string {
  if (!ISO_DAY.test(date)) return date;
  const [year, month, day] = date.split("-");
  return `${day} ${SHORT_MONTHS[Number(month) - 1]}, ${year}`;
}

export function formatAxisDate(date: string): string {
  if (!ISO_DAY.test(date)) return date;
  const [, month, day] = date.split("-");
  return `${Number(day)} ${SHORT_MONTHS[Number(month) - 1]}`;
}

/** 1_240 → "1.2K". Used for the headline and the peak/low/avg footer. */
export function formatCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return `${Math.round(value)}`;
}

type ChartPoint = { x: number; y: number };

/**
 * One monotone cubic per pair of recorded points, so the curve never invents a
 * peak or dip the data does not have.
 */
function monotoneChartPath(pts: ChartPoint[], bandBottom: number): { line: string; fill: string } {
  if (pts.length === 0) return { line: "", fill: "" };
  const coords = (x: number, y: number) => `${x.toFixed(3)} ${y.toFixed(3)}`;
  if (pts.length === 1) {
    const line = `M ${coords(3, pts[0].y)} L ${coords(100, pts[0].y)}`;
    return { line, fill: `${line} L ${coords(100, bandBottom)} L ${coords(3, bandBottom)} Z` };
  }

  const n = pts.length;
  const dxs = pts.slice(1).map((point, i) => point.x - pts[i].x);
  const deltas = dxs.map((dx, i) => (dx === 0 ? 0 : (pts[i + 1].y - pts[i].y) / dx));
  const tangents: number[] = new Array(n);
  for (let i = 1; i < n - 1; i++) {
    const previous = deltas[i - 1];
    const next = deltas[i];
    tangents[i] =
      previous * next <= 0
        ? 0
        : (3 * (dxs[i - 1] + dxs[i])) /
          ((2 * dxs[i] + dxs[i - 1]) / previous + (dxs[i] + 2 * dxs[i - 1]) / next);
  }
  tangents[0] = deltas[0];
  tangents[n - 1] = deltas[n - 2];
  if (deltas.length > 1) {
    if (deltas[0] * deltas[1] <= 0) tangents[0] = 0;
    if (deltas[n - 2] * deltas[n - 3] <= 0) tangents[n - 1] = 0;
  }

  // Limit the endpoint slopes so each cubic stays within its two real values.
  for (let i = 0; i < n - 1; i++) {
    if (deltas[i] === 0) {
      tangents[i] = 0;
      tangents[i + 1] = 0;
    } else {
      const alpha = tangents[i] / deltas[i];
      const beta = tangents[i + 1] / deltas[i];
      const distance = alpha * alpha + beta * beta;
      if (distance > 9) {
        const factor = 3 / Math.sqrt(distance);
        tangents[i] = factor * alpha * deltas[i];
        tangents[i + 1] = factor * beta * deltas[i];
      }
    }
  }

  let line = `M ${coords(pts[0].x, pts[0].y)}`;
  for (let i = 0; i < n - 1; i++) {
    const start = pts[i];
    const end = pts[i + 1];
    const third = dxs[i] / 3;
    line += ` C ${coords(start.x + third, start.y + tangents[i] * third)}, ${coords(end.x - third, end.y - tangents[i + 1] * third)}, ${coords(end.x, end.y)}`;
  }
  const fill = `${line} L ${coords(pts[n - 1].x, bandBottom)} L ${coords(pts[0].x, bandBottom)} Z`;
  return { line, fill };
}

/*
 * The chart draws into a 0-100 viewBox with preserveAspectRatio="none", so one
 * unit is a percentage of the region in each axis independently. Strokes are
 * non-scaling so that stretch never thickens a line.
 *
 * The band leaves headroom at the top for the card's headline and clearance at
 * the bottom for its footer; the chart sits behind both.
 */
const BAND_TOP = 34;
const BAND_BOTTOM = 100;
// Left keeps a small inset so the line isn't glued to the edge; right is 0 so
// the last point reaches the edge (stopping short reads as a day missing).
const X_INSET_LEFT = 3;
const X_INSET_RIGHT = 0;

const SPRING = { type: "spring", stiffness: 600, damping: 45 } as const;

export interface MetricChartProps {
  series: ChartSeries[];
  view: ChartView;
  /** Point the cursor rests on when nothing is hovered. */
  defaultIndex: number;
  valueFormatter: (value: number) => string;
  dateFormatter: (date: string) => string;
  compactFormatter?: (value: number) => string;
  bandBottom?: number;
  bandTop?: number;
  showAxes?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  /**
   * Smooth (monotone spline) vs exact polyline. Default true. Neither mode
   * morphs between datasets, so a period change never draws phantom peaks.
   */
  smooth?: boolean;
  className?: string;
}

export function MetricChart({
  series,
  view,
  defaultIndex,
  valueFormatter,
  dateFormatter,
  compactFormatter = formatCompact,
  bandBottom: bandBottomProp,
  bandTop: bandTopProp,
  showAxes = false,
  showXAxis: showXAxisProp,
  showYAxis: showYAxisProp,
  smooth = true,
  className,
}: MetricChartProps) {
  const rawId = useId().replace(/:/g, "");
  const rootRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [hasEnteredView, setHasEnteredView] = useState(false);
  const reduceMotion = useReducedMotionConfig() ?? false;

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasEnteredView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const showXAxis = showXAxisProp ?? showAxes;
  const showYAxis = showYAxisProp ?? showAxes;
  const bandTop = bandTopProp ?? BAND_TOP;
  const bandBottom = bandBottomProp ?? (showXAxis ? 84 : BAND_BOTTOM);
  const xInsetRight = showYAxis ? 6 : X_INSET_RIGHT;

  const length = series[0]?.data.length ?? 0;
  const active = Math.min(Math.max(hovered ?? defaultIndex, 0), Math.max(length - 1, 0));

  // One scale across every series, so two lines on the same card are comparable.
  const { min, max } = useMemo(() => {
    const values = series.flatMap((s) => s.data.map((d) => d.value));
    if (!values.length) return { min: 0, max: 1 };
    const lo = Math.min(...values);
    const hi = Math.max(...values);
    const baseline = showYAxis && lo >= 0 ? 0 : lo;
    return hi === baseline ? { min: baseline, max: baseline + 1 } : { min: baseline, max: hi };
  }, [series, showYAxis]);

  const toX = (i: number, len: number) =>
    len <= 1 ? 50 : X_INSET_LEFT + (i / (len - 1)) * (100 - X_INSET_LEFT - xInsetRight);

  const toY = (value: number) => bandBottom - ((value - min) / (max - min)) * (bandBottom - bandTop);

  const yTicks = useMemo(() => {
    if (!showYAxis) return [];
    if (max <= min) return [min];
    const diff = max - min;
    const mid = min + diff / 2;
    const roundMid = Number.isInteger(diff) ? Math.round(mid) : Number(mid.toFixed(1));
    return Array.from(new Set([max, roundMid, min])).sort((a, b) => b - a);
  }, [showYAxis, min, max]);

  const xTicks = useMemo(() => {
    if (!showXAxis || length < 1) return [];
    const at = (index: number) => ({ index, date: series[0].data[index].date });
    if (length === 1) return [at(0)];
    if (length === 2) return [at(0), at(1)];
    return [at(0), at(Math.floor((length - 1) / 2)), at(length - 1)];
  }, [showXAxis, length, series]);

  if (!length) return null;

  const activeDate = series[0].data[active]?.date ?? "";
  const cursorX = toX(active, length);

  const handlePointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    if (!box.width || length <= 1) {
      setHovered(0);
      return;
    }
    const rawX = ((event.clientX - box.left) / box.width) * 100;
    const fractionalIndex = ((rawX - X_INSET_LEFT) / (100 - X_INSET_LEFT - xInsetRight)) * (length - 1);
    setHovered(Math.min(length - 1, Math.max(0, Math.round(fractionalIndex))));
  };

  return (
    <div
      ref={rootRef}
      className={cn("relative h-full w-full touch-none select-none overflow-visible", className)}
      onPointerLeave={() => setHovered(null)}
      onPointerDown={handlePointer}
      onPointerMove={handlePointer}
    >
      {/* Clips the plot to the region, inheriting the card's right-hand radius. */}
      <div className="absolute inset-0 overflow-hidden rounded-r-[inherit]">
        <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            {series.map((s, i) => (
              <linearGradient key={s.name} id={`${rawId}-fill-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.28} />
                <stop offset="60%" stopColor={s.color} stopOpacity={0.08} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>

          {/* Cursor guide line with spring tracking */}
          <motion.line
            initial={false}
            animate={{ x1: cursorX, x2: cursorX, opacity: hovered !== null ? 0.45 : 0 }}
            transition={{ x1: SPRING, x2: SPRING, opacity: { duration: 0.15 } }}
            y1={bandTop - 6}
            y2={bandBottom}
            stroke="currentColor"
            strokeWidth={1}
            strokeDasharray="3 3"
            vectorEffect="non-scaling-stroke"
            className="text-foreground"
          />

          {showYAxis &&
            yTicks.map((tick) => (
              <line
                key={`ygrid-${tick}`}
                x1={0}
                x2={100}
                y1={toY(tick)}
                y2={toY(tick)}
                stroke="currentColor"
                strokeDasharray="2 3"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
                className="text-ink/[0.06]"
              />
            ))}

          {showXAxis && (
            <line
              x1={0}
              x2={100}
              y1={bandBottom}
              y2={bandBottom}
              stroke="currentColor"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              className="text-ink/[0.08]"
            />
          )}

          {series.map((s, seriesIndex) => {
            const pts = s.data.map((d, i) => ({ x: toX(i, s.data.length), y: toY(d.value) }));

            if (view === "bars") {
              const slot = (100 - X_INSET_LEFT - xInsetRight) / Math.max(s.data.length, 1);
              const width = Math.max(slot * (series.length > 1 ? 0.34 : 0.5), 0.6);
              const offset = (seriesIndex - (series.length - 1) / 2) * width;
              return (
                <g key={s.name}>
                  {pts.map((p, i) => {
                    // The last point sits on the right edge; pull its bar inward
                    // so it doesn't spill past the card border.
                    const barXShift = i === s.data.length - 1 ? -width / 2 : 0;
                    return (
                      <motion.rect
                        key={s.data[i].date}
                        x={p.x + offset - width / 2 + barXShift}
                        width={width}
                        rx={0.5}
                        initial={reduceMotion ? false : { y: bandBottom, height: 0, opacity: 0 }}
                        animate={{
                          y: p.y,
                          height: Math.max(bandBottom - p.y, 0.5),
                          opacity:
                            hasEnteredView || reduceMotion
                              ? hovered !== null
                                ? i === active
                                  ? 1
                                  : 0.42
                                : 0.85
                              : 0,
                        }}
                        transition={
                          reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 28 }
                        }
                        fill={s.color}
                      />
                    );
                  })}
                </g>
              );
            }

            if (pts.length === 0) return null;

            // Exact mode: straight segments through every point, no smoothing
            // and no morph, so a new window snaps to its true shape.
            if (!smooth) {
              if (pts.length === 1) return <g key={s.name} />;
              const line = pts
                .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(3)} ${p.y.toFixed(3)}`)
                .join(" ");
              const fill = `${line} L ${pts[pts.length - 1].x.toFixed(3)} ${bandBottom.toFixed(3)} L ${pts[0].x.toFixed(3)} ${bandBottom.toFixed(3)} Z`;
              return (
                <g key={s.name}>
                  <path d={fill} fill={`url(#${rawId}-fill-${seriesIndex})`} />
                  <path
                    d={line}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={2.25}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              );
            }

            const { line, fill } = monotoneChartPath(pts, bandBottom);
            return (
              <g key={`${s.name}:${s.data[0]?.date}:${s.data[s.data.length - 1]?.date}:${line}`}>
                {/* Dash-based drawing breaks under non-uniform scaling with
                    non-scaling-stroke, so a clip reveals line and fill together. */}
                <defs>
                  <clipPath id={`${rawId}-reveal-${seriesIndex}`} clipPathUnits="userSpaceOnUse">
                    <motion.rect
                      x={0}
                      y={0}
                      height={100}
                      width={100}
                      initial={reduceMotion ? false : { width: 0 }}
                      animate={{ width: hasEnteredView || reduceMotion ? 100 : 0 }}
                      transition={{ duration: reduceMotion ? 0 : 0.65, ease: EASE }}
                    />
                  </clipPath>
                </defs>
                <g clipPath={`url(#${rawId}-reveal-${seriesIndex})`}>
                  <path d={fill} fill={`url(#${rawId}-fill-${seriesIndex})`} />
                  <path
                    d={line}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={2.25}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      {showYAxis &&
        yTicks.map((tick) => (
          <div
            key={`ytick-${tick}`}
            className="pointer-events-none absolute right-1.5 z-10 -translate-y-1/2 select-none"
            style={{ top: `${toY(tick)}%` }}
          >
            <span className="font-body text-[11px] font-medium tabular-nums text-dim">
              {compactFormatter(tick)}
            </span>
          </div>
        ))}

      {showXAxis && xTicks.length > 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-1 z-10 select-none font-body text-[11px] font-medium text-dim">
          {xTicks.map((tick, i) => {
            const isFirst = i === 0;
            const isLast = i === xTicks.length - 1;
            return (
              <span
                key={`xtick-${tick.date}-${i}`}
                className="absolute whitespace-nowrap"
                style={{
                  left: `${toX(tick.index, length)}%`,
                  transform: isFirst ? "translateX(0)" : isLast ? "translateX(-100%)" : "translateX(-50%)",
                }}
              >
                {formatAxisDate(tick.date)}
              </span>
            );
          })}
        </div>
      )}

      {/* Point markers, outside the clipped wrapper so the end dot can sit on the border. */}
      {view === "curve" &&
        series.map((s) => {
          const point = s.data[Math.min(active, s.data.length - 1)];
          if (!point) return null;
          const targetX = toX(Math.min(active, s.data.length - 1), s.data.length);
          const targetY = toY(point.value);
          // A lone point has no line to read, so its dot stays visible.
          const alone = s.data.length <= 1;
          // Nudge the right-edge dot inward via the standalone `translate`
          // property; Motion owns `transform`.
          const edgeDotNudge = targetX >= 100 ? "8px" : null;
          return (
            <motion.div
              key={s.name}
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
              style={edgeDotNudge ? { translate: `calc(-50% + ${edgeDotNudge}) -50%` } : undefined}
              initial={false}
              animate={{
                left: `${targetX}%`,
                top: `${targetY}%`,
                scale: hovered !== null ? 1.15 : alone ? 1 : 0.7,
                opacity: hovered !== null || alone ? 1 : 0,
              }}
              transition={{
                left: SPRING,
                top: SPRING,
                scale: { duration: 0.15 },
                opacity: { duration: 0.15 },
              }}
            >
              <span
                className="relative block h-3 w-3 rounded-full border-2 border-card shadow-sm"
                style={{ background: s.color }}
              />
            </motion.div>
          );
        })}

      {/* Tooltip: a glass card tracking the cursor on a spring. */}
      <AnimatePresence>
        {hovered !== null && (
          <motion.div
            className="pointer-events-none absolute z-50"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ left: `${cursorX}%`, top: `${BAND_TOP}%`, opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
              left: SPRING,
              top: SPRING,
              opacity: { duration: 0.15 },
              scale: { duration: 0.15 },
            }}
            // Flip with the standalone `translate` property, not `transform`:
            // Motion rewrites `transform` every frame while animating `scale`.
            style={{ translate: cursorX > 50 ? "calc(-100% - 12px) -50%" : "12px -50%" }}
          >
            <div className="relative min-w-[130px] rounded-xl border border-rule bg-popover/95 px-3.5 py-2.5 shadow-lg backdrop-blur-md">
              <p className="whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground/80">
                {dateFormatter(activeDate)}
              </p>
              <div className="mt-1 space-y-1">
                {series.map((s) => {
                  const val = s.data[Math.min(active, s.data.length - 1)]?.value ?? 0;
                  return (
                    <div
                      key={s.name}
                      className="flex items-center justify-between gap-3 whitespace-nowrap text-[13px] font-semibold tabular-nums text-foreground"
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-2 w-2 rounded-full ring-2 ring-card"
                          style={{ background: s.color, boxShadow: `0 0 6px ${s.color}` }}
                        />
                        {series.length > 1 && (
                          <span className="text-[12px] font-medium text-muted-foreground">{s.name}</span>
                        )}
                      </div>
                      <span className="font-bold tracking-tight">{valueFormatter(val)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
