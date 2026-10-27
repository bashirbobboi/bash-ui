"use client";

import { useCallback, useId, useMemo, useState } from "react";
import { Activity, BarChart3 } from "lucide-react";
import { AnimatePresence, motion, useReducedMotionConfig } from "motion/react";

import { cn } from "@/lib/utils";
import {
  DateRangePicker,
  type PeriodOption,
} from "../date-range-calendar/date-range-picker";

export type { PeriodOption };

/**
 * A time-series chart card for a pipeline: several named stages (contacted,
 * replied, converted) against a real pair of axes, counts up the left and dates
 * along the bottom. The plot is the content and spans the card; each stage's
 * figure sits above it with its own change against the window before, because
 * three lines deserve three captions.
 *
 * The window is the reader's: presets of trailing days, or a custom range on a
 * calendar bounded to the data. Long windows are bucketed into weeks (or
 * four-week blocks) so three lines stay legible. Changing the window morphs the
 * curves rather than cutting between them; the line/bar toggle, legend
 * show/hide and a crosshair tooltip (pointer or arrow keys) round it out.
 *
 * Colours are fixed per series index, never per visible position, so hiding a
 * series never repaints the ones that remain.
 */

/** One day's count. `date` is a UTC ISO day, YYYY-MM-DD. */
export type SeriesPoint = { date: string; value: number };

/** A named stage. `color` overrides the default colour for its index. */
export type PipelineSeries = { name: string; data: SeriesPoint[]; color?: string };

export type ChartView = "curve" | "bars";

/** A legend figure supplied by the caller instead of the summed window. */
export type SeriesTotal = { total: number; previous?: number | null };

/**
 * Categorical series colours, in fixed assignment order: green, blue, amber,
 * red, grey. Past three, identity leans on the legend and end-of-line labels.
 */
export const PIPELINE_SERIES_COLORS = [
  "var(--go)",
  "var(--lead)",
  "var(--hold)",
  "var(--stop)",
  "var(--dim)",
];

const EASE = [0.2, 0.7, 0.2, 1] as const;

/** How many buckets before daily points stop being readable as three lines. */
const MAX_DAILY_BUCKETS = 35;
const MAX_WEEKLY_BUCKETS = 220;

type Grain = "day" | "week" | "month";

const GRAIN_NOTE: Record<Grain, string> = {
  day: "daily totals",
  week: "weekly totals",
  month: "four-week totals",
};

const GRAIN_DAYS: Record<Grain, number> = { day: 1, week: 7, month: 28 };

/** A plotted point: a span of days and what happened across it. */
type Bucket = { start: string; end: string; value: number };

/** Top leaves room for the axis unit above the highest gridline. */
const PLOT_PAD = { top: 28, bottom: 30, left: 46 } as const;
/** Room at the right for the end-of-line labels; dropped on narrow cards. */
const END_LABEL_W = 78;
const END_LABEL_MIN_WIDTH = 520;
/** Minimum vertical gap between two end labels before they are pushed apart. */
const END_LABEL_LEAD = 13;
const BAR_MAX_W = 24;
/** Every curve is sampled to the same number of Bézier segments so it can morph. */
const SPLINE_SAMPLES = 40;

const SHORT_MONTHS = [
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

// Month names spelled here, not by Intl: runtimes disagree on "Sep".
function monthDay(d: Date): string {
  return `${d.getUTCDate()} ${SHORT_MONTHS[d.getUTCMonth()]}`;
}
function monthDayYear(d: Date): string {
  return `${monthDay(d)} ${d.getUTCFullYear()}`;
}
function parseDay(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

function grainFor(buckets: number): Grain {
  if (buckets <= MAX_DAILY_BUCKETS) return "day";
  if (buckets <= MAX_WEEKLY_BUCKETS) return "week";
  return "month";
}

/**
 * Trim a series to the window. A preset keeps the trailing N points; an
 * explicit from/to filters inclusively and wins over the preset.
 */
function sliceWindow(points: SeriesPoint[], option: PeriodOption): SeriesPoint[] {
  const { points: n, from, to } = option;
  let out = points;
  if (from) out = out.filter((point) => point.date >= from);
  if (to) out = out.filter((point) => point.date <= to);
  if (!from && !to && n && n < out.length) out = out.slice(-n);
  return out;
}

/**
 * Sum daily points into buckets, counted back from the most recent day, so
 * every bucket covers the same number of whole days and the last one is
 * comparable to the one before it. A part-finished calendar week would always
 * plot as a cliff. The oldest few days fall off the left edge instead.
 */
function bucketSeries(points: SeriesPoint[], grain: Grain): Bucket[] {
  const size = GRAIN_DAYS[grain];
  if (size === 1) {
    return points.map((point) => ({ start: point.date, end: point.date, value: point.value }));
  }
  const buckets: Bucket[] = [];
  for (let end = points.length; end - size >= 0; end -= size) {
    const chunk = points.slice(end - size, end);
    buckets.unshift({
      start: chunk[0].date,
      end: chunk[chunk.length - 1].date,
      value: chunk.reduce((sum, point) => sum + point.value, 0),
    });
  }
  return buckets;
}

/** Axis ticks on round numbers, from zero, never fractional for counts. */
function axisTicks(max: number, target = 4): number[] {
  if (!Number.isFinite(max) || max <= 0) return [0, 1];
  const raw = max / target;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalised = raw / magnitude;
  // 1.5 and 3 are on the ladder so a max of 600 tops out at 600, not 800.
  const rungs = [1, 1.5, 2, 2.5, 3, 5, 10];
  const step = Math.max(1, (rungs.find((rung) => normalised <= rung) ?? 10) * magnitude);
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let value = 0; value <= top + 1e-9; value += step) ticks.push(Math.round(value));
  return ticks;
}

/**
 * A monotone (Fritsch–Carlson) spline through the points, resampled to a fixed
 * number of Bézier segments. Fixed topology is the point: every path has the
 * same command structure, so Motion can morph one window's curve into the next.
 */
function splinePath(points: { x: number; y: number }[], samples = SPLINE_SAMPLES): string {
  const n = points.length;
  if (n === 0) return "";
  if (n === 1) {
    const { x, y } = points[0];
    return `M ${x.toFixed(2)} ${y.toFixed(2)} L ${x.toFixed(2)} ${y.toFixed(2)}`;
  }

  const dxs: number[] = [];
  const slopes: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    dxs.push(dx);
    slopes.push(dx === 0 ? 0 : (points[i + 1].y - points[i].y) / dx);
  }

  const tangents: number[] = new Array(n);
  tangents[0] = slopes[0];
  tangents[n - 1] = slopes[n - 2];
  for (let i = 1; i < n - 1; i++) {
    const prev = slopes[i - 1];
    const next = slopes[i];
    if (prev * next <= 0) {
      tangents[i] = 0;
    } else {
      const hPrev = dxs[i - 1];
      const hNext = dxs[i];
      tangents[i] = (3 * (hPrev + hNext)) / ((2 * hNext + hPrev) / prev + (hNext + 2 * hPrev) / next);
    }
  }
  for (let i = 0; i < n - 1; i++) {
    if (slopes[i] === 0) {
      tangents[i] = 0;
      tangents[i + 1] = 0;
      continue;
    }
    const alpha = tangents[i] / slopes[i];
    const beta = tangents[i + 1] / slopes[i];
    const distance = alpha * alpha + beta * beta;
    if (distance > 9) {
      const tau = 3 / Math.sqrt(distance);
      tangents[i] = tau * alpha * slopes[i];
      tangents[i + 1] = tau * beta * slopes[i];
    }
  }

  const evaluate = (x: number): { y: number; dy: number } => {
    if (x <= points[0].x) return { y: points[0].y, dy: tangents[0] };
    if (x >= points[n - 1].x) return { y: points[n - 1].y, dy: tangents[n - 1] };
    let i = 0;
    while (i < n - 2 && points[i + 1].x < x) i++;
    const h = points[i + 1].x - points[i].x;
    if (h === 0) return { y: points[i].y, dy: 0 };
    const t = (x - points[i].x) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    const y0 = points[i].y;
    const y1 = points[i + 1].y;
    const m0 = tangents[i];
    const m1 = tangents[i + 1];
    return {
      y:
        (2 * t3 - 3 * t2 + 1) * y0 +
        (t3 - 2 * t2 + t) * h * m0 +
        (-2 * t3 + 3 * t2) * y1 +
        (t3 - t2) * h * m1,
      dy:
        ((6 * t2 - 6 * t) * y0 +
          (3 * t2 - 4 * t + 1) * h * m0 +
          (-6 * t2 + 6 * t) * y1 +
          (3 * t2 - 2 * t) * h * m1) /
        h,
    };
  };

  const minX = points[0].x;
  const maxX = points[n - 1].x;
  const step = (maxX - minX) / (samples - 1);
  const taken = Array.from({ length: samples }, (_, k) => {
    const x = minX + k * step;
    const { y, dy } = evaluate(x);
    return { x, y, dy };
  });

  let path = `M ${taken[0].x.toFixed(2)} ${taken[0].y.toFixed(2)}`;
  for (let k = 0; k < samples - 1; k++) {
    const a = taken[k];
    const b = taken[k + 1];
    const dx = b.x - a.x;
    path += ` C ${(a.x + dx / 3).toFixed(2)} ${(a.y + (a.dy * dx) / 3).toFixed(2)}, ${(
      b.x -
      dx / 3
    ).toFixed(2)} ${(b.y - (b.dy * dx) / 3).toFixed(2)}, ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
  }
  return path;
}

/** A column with a rounded cap and square feet on the baseline. */
function columnPath(x: number, y: number, width: number, baseline: number): string {
  const height = Math.max(baseline - y, 0);
  const radius = Math.min(4, width / 2, height);
  if (height <= 0.5) return `M ${x} ${baseline} L ${x + width} ${baseline}`;
  return [
    `M ${x.toFixed(2)} ${baseline.toFixed(2)}`,
    `L ${x.toFixed(2)} ${(y + radius).toFixed(2)}`,
    `Q ${x.toFixed(2)} ${y.toFixed(2)} ${(x + radius).toFixed(2)} ${y.toFixed(2)}`,
    `L ${(x + width - radius).toFixed(2)} ${y.toFixed(2)}`,
    `Q ${(x + width).toFixed(2)} ${y.toFixed(2)} ${(x + width).toFixed(2)} ${(y + radius).toFixed(2)}`,
    `L ${(x + width).toFixed(2)} ${baseline.toFixed(2)}`,
    "Z",
  ].join(" ");
}

function formatCount(value: number): string {
  return value.toLocaleString("en-GB");
}

function formatCompactCount(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (Math.abs(value) >= 10_000) return `${Math.round(value / 1000)}K`;
  return formatCount(value);
}

/** The x-axis tick under a bucket: the day it ends. */
function formatAxisDate(bucket: Bucket, withYear: boolean): string {
  return (withYear ? monthDayYear : monthDay)(parseDay(bucket.end));
}

/** The span a bucket covers, spelled out for the tooltip and the table. */
function formatBucketRange(bucket: Bucket): string {
  if (bucket.start === bucket.end) return monthDayYear(parseDay(bucket.end));
  return `${monthDay(parseDay(bucket.start))} – ${monthDayYear(parseDay(bucket.end))}`;
}

/**
 * Change against the window immediately before this one. null where there is no
 * window before it: a made-up "+100%" against nothing is worse than nothing.
 */
function changeFor(
  total: number,
  previous: number | null,
): { text: string; direction: 1 | 0 | -1 } | null {
  if (previous === null) return null;
  if (previous === 0) {
    if (total === 0) return { text: "no change", direction: 0 };
    return { text: "all new", direction: 1 };
  }
  const pct = ((total - previous) / previous) * 100;
  if (Math.abs(pct) < 0.5) return { text: "no change", direction: 0 };
  return {
    text: `${pct > 0 ? "+" : "−"}${Math.abs(pct).toFixed(0)}%`,
    direction: pct > 0 ? 1 : -1,
  };
}

/** Line or bars, with a pill that slides between the two. */
function ViewToggle({
  value,
  onChange,
  layoutId,
}: {
  value: ChartView;
  onChange: (view: ChartView) => void;
  layoutId: string;
}) {
  const reduceMotion = useReducedMotionConfig();
  const item = (view: ChartView, Icon: typeof Activity, label: string) => {
    const isSelected = value === view;
    return (
      <button
        type="button"
        aria-label={label}
        aria-pressed={isSelected}
        onClick={() => onChange(view)}
        className={cn(
          "relative z-10 rounded-full p-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lead",
          isSelected ? "font-semibold text-ink" : "text-faint hover:text-ink",
        )}
      >
        {isSelected && (
          <motion.div
            layoutId={layoutId}
            className="absolute inset-0 rounded-full bg-card shadow-sm"
            transition={
              reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 450, damping: 30 }
            }
          />
        )}
        <span className="relative z-10 block">
          <Icon size={14} strokeWidth={2.5} />
        </span>
      </button>
    );
  };

  return (
    <div className="flex items-center gap-0.5 rounded-full bg-paper p-0.5">
      {item("curve", Activity, "Line view")}
      {item("bars", BarChart3, "Bar view")}
    </div>
  );
}

export interface PipelineChartProps {
  title: string;
  /** What one point means, in the words of the job. The grain is appended. */
  subtitle?: string;
  /** One series per stage, daily points in date order, all the same dates. */
  series: PipelineSeries[];
  /** Plural noun for the y-axis caption, e.g. "clients". */
  unit?: string;
  /** Label of the preset to open on. */
  period?: string;
  periodOptions?: PeriodOption[];
  /** Adds a "Custom range" step with a calendar bounded to the data. */
  allowCustomRange?: boolean;
  /**
   * Fires when the reader picks a window: the option, and the first and last
   * day it resolved to in the data (null when the window holds nothing). Use it
   * to fetch a fresh window; the card already filters what it was given.
   */
  onRangeChange?: (option: PeriodOption, window: { from: string; to: string } | null) => void;
  /**
   * Legend figures per series, overriding the summed window (e.g. distinct
   * clients counted by the server). `previous` enables the change figure.
   */
  totals?: (SeriesTotal | undefined)[];
  defaultView?: ChartView;
  /** Unique across the page: the view toggle's pill animates between matches. */
  toggleId?: string;
  emptyMessage?: string;
  /** Fixes "today" for the calendar's presets; defaults to the clock. */
  now?: Date;
  className?: string;
}

export function PipelineChart({
  title,
  subtitle,
  series,
  unit = "",
  period = "Past 30 days",
  periodOptions,
  allowCustomRange = false,
  onRangeChange,
  totals: totalsOverride,
  defaultView = "curve",
  toggleId,
  emptyMessage = "Nothing to chart yet. This fills in as outreach happens.",
  now,
  className,
}: PipelineChartProps) {
  const reduceMotion = useReducedMotionConfig();
  const reactId = useId().replace(/:/g, "");
  const periods = useMemo<PeriodOption[]>(
    () =>
      periodOptions ?? [
        { label: "Past 30 days", points: 30 },
        { label: "Past 90 days", points: 90 },
      ],
    [periodOptions],
  );
  const defaultPeriod = periods.find((option) => option.label === period) ?? periods[0];

  const [selected, setSelected] = useState<PeriodOption>(() => defaultPeriod);
  const [view, setView] = useState<ChartView>(defaultView);
  const [hiddenNames, setHiddenNames] = useState<string[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  const measure = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      const box = entry.contentRect;
      setSize({ width: box.width, height: box.height });
    });
    observer.observe(node);
    setSize({ width: node.clientWidth, height: node.clientHeight });
    return () => observer.disconnect();
  }, []);

  /** The full extent of the data, for the calendar's selectable bounds. */
  const bounds = useMemo(() => {
    let min: string | null = null;
    let max: string | null = null;
    for (const entry of series) {
      for (const point of entry.data) {
        if (min === null || point.date < min) min = point.date;
        if (max === null || point.date > max) max = point.date;
      }
    }
    return { min, max };
  }, [series]);

  const choosePeriod = (option: PeriodOption) => {
    setSelected(option);
    setActive(null);
    if (onRangeChange) {
      const slice = sliceWindow(series[0]?.data ?? [], option);
      onRangeChange(
        option,
        slice.length ? { from: slice[0].date, to: slice[slice.length - 1].date } : null,
      );
    }
  };

  const windowed = useMemo(
    () => series.map((entry) => ({ ...entry, data: sliceWindow(entry.data, selected) })),
    [series, selected],
  );

  /** The same length of time immediately before the window, for the change figures. */
  const previousWindow = useMemo(() => {
    const length = windowed[0]?.data.length ?? 0;
    if (length === 0) return series.map(() => [] as SeriesPoint[]);
    const firstDate = windowed[0].data[0].date;
    return series.map((entry) =>
      entry.data.filter((point) => point.date < firstDate).slice(-length),
    );
  }, [series, windowed]);

  const grain = grainFor(windowed[0]?.data.length ?? 0);

  const bucketed = useMemo(
    () => windowed.map((entry) => ({ ...entry, data: bucketSeries(entry.data, grain) })),
    [windowed, grain],
  );

  const totals = useMemo(
    () =>
      windowed.map((entry, index) => {
        const override = totalsOverride?.[index];
        if (override) {
          return {
            total: override.total,
            change: changeFor(override.total, override.previous ?? null),
          };
        }
        const total = entry.data.reduce((sum, point) => sum + point.value, 0);
        const before = previousWindow[index];
        const previous =
          before.length === 0 ? null : before.reduce((sum, point) => sum + point.value, 0);
        return { total, change: changeFor(total, previous) };
      }),
    [windowed, previousWindow, totalsOverride],
  );

  const visible = bucketed.filter((entry) => !hiddenNames.includes(entry.name));
  const length = bucketed[0]?.data.length ?? 0;
  const hasData = length >= 2;

  const colourOf = useCallback(
    (name: string) => {
      const index = series.findIndex((entry) => entry.name === name);
      const own = index >= 0 ? series[index].color : undefined;
      return own ?? PIPELINE_SERIES_COLORS[(index < 0 ? 0 : index) % PIPELINE_SERIES_COLORS.length];
    },
    [series],
  );

  const spansYears = useMemo(() => {
    const first = bucketed[0]?.data[0]?.end;
    const last = bucketed[0]?.data[length - 1]?.end;
    return Boolean(first && last && first.slice(0, 4) !== last.slice(0, 4));
  }, [bucketed, length]);

  const showEndLabels = size.width >= END_LABEL_MIN_WIDTH;
  const padRight = showEndLabels ? END_LABEL_W : 14;
  const plotLeft = PLOT_PAD.left;
  const plotTop = PLOT_PAD.top;
  const plotWidth = Math.max(size.width - plotLeft - padRight, 1);
  const plotBottom = Math.max(size.height - PLOT_PAD.bottom, plotTop + 1);
  const plotHeight = plotBottom - plotTop;

  const yMaxRaw = useMemo(() => {
    let max = 0;
    for (const entry of visible) for (const point of entry.data) max = Math.max(max, point.value);
    return max;
  }, [visible]);

  const ticks = useMemo(() => axisTicks(yMaxRaw), [yMaxRaw]);
  const yMax = ticks[ticks.length - 1] || 1;

  /**
   * Columns are centred in a slot so the first group cannot straddle the axis;
   * a line still starts on the axis and ends on the right edge.
   */
  const toX = useCallback(
    (index: number) => {
      if (length <= 1) return plotLeft + plotWidth / 2;
      if (view === "bars") return plotLeft + (plotWidth / length) * (index + 0.5);
      return plotLeft + (index / (length - 1)) * plotWidth;
    },
    [length, plotLeft, plotWidth, view],
  );
  const toY = useCallback(
    (value: number) => plotBottom - (value / yMax) * plotHeight,
    [plotBottom, plotHeight, yMax],
  );

  const xTicks = useMemo(() => {
    if (!hasData || plotWidth <= 0) return [];
    const room = grain === "day" ? 74 : 86;
    const count = Math.max(2, Math.min(6, Math.floor(plotWidth / room)));
    const indices = new Set<number>();
    for (let i = 0; i < count; i++) indices.add(Math.round((i * (length - 1)) / (count - 1)));
    return [...indices].sort((a, b) => a - b);
  }, [hasData, plotWidth, grain, length]);

  /**
   * End-of-line labels, pushed apart where two lines finish close together;
   * each one that moved gets a leader line back to its point.
   */
  const endLabels = useMemo(() => {
    if (!showEndLabels || !hasData) return [];
    const raw = visible
      .map((entry) => {
        const point = entry.data[entry.data.length - 1];
        if (!point) return null;
        return { name: entry.name, y: toY(point.value), anchor: toY(point.value) };
      })
      .filter((item): item is { name: string; y: number; anchor: number } => item !== null)
      .sort((a, b) => a.y - b.y);
    for (let i = 1; i < raw.length; i++) {
      if (raw[i].y - raw[i - 1].y < END_LABEL_LEAD) raw[i].y = raw[i - 1].y + END_LABEL_LEAD;
    }
    const overflow = raw.length ? raw[raw.length - 1].y - plotBottom : 0;
    if (overflow > 0) for (const item of raw) item.y -= overflow;
    return raw;
  }, [showEndLabels, hasData, visible, toY, plotBottom]);

  const handlePointer = (event: React.PointerEvent<HTMLDivElement>) => {
    if (length <= 1) return setActive(0);
    const box = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - box.left - plotLeft) / plotWidth;
    const index = view === "bars" ? Math.floor(ratio * length) : Math.round(ratio * (length - 1));
    setActive(Math.min(length - 1, Math.max(0, index)));
  };

  const handleKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const step = event.key === "ArrowRight" ? 1 : -1;
    setActive((current) => {
      const next = (current ?? (step > 0 ? -1 : length)) + step;
      return Math.min(length - 1, Math.max(0, next));
    });
  };

  const activeIndex = active === null ? null : Math.min(active, Math.max(length - 1, 0));
  const activeBucket = activeIndex === null ? null : (bucketed[0]?.data[activeIndex] ?? null);
  const grainNote = GRAIN_NOTE[grain];

  const spring = (stiffness: number, damping: number) =>
    reduceMotion ? { duration: 0 } : ({ type: "spring", stiffness, damping } as const);

  return (
    <div
      className={cn(
        "flex w-full flex-col rounded-panel border border-rule bg-card p-4 font-body shadow-[0_2px_10px_color-mix(in_oklab,var(--ink)_4%,transparent)] sm:p-6",
        className,
      )}
    >
      {/* Header: what this is, then how much of it to show. */}
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 items-center gap-3">
          <div className="min-w-0">
            <h3 className="font-heading text-[20px] font-semibold tracking-tight text-ink">
              {title}
            </h3>
            <p className="mt-0.5 text-[12px] text-dim">
              {subtitle ? `${subtitle} · ${grainNote}` : grainNote}
            </p>
          </div>
          <ViewToggle
            value={view}
            onChange={setView}
            layoutId={toggleId ?? `${reactId}-view-toggle`}
          />
        </div>
        <DateRangePicker
          value={selected.label}
          options={periods}
          onChange={choosePeriod}
          allowCustomRange={allowCustomRange}
          defaultOption={defaultPeriod}
          rangeMin={bounds.min}
          rangeMax={bounds.max}
          now={now}
        />
      </div>

      {/* The legend is also the summary: one figure per series, with its change. */}
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
        {bucketed.map((entry, index) => {
          const isHidden = hiddenNames.includes(entry.name);
          const summary = totals[index];
          return (
            <button
              key={entry.name}
              type="button"
              aria-pressed={!isHidden}
              onClick={() =>
                setHiddenNames((current) => {
                  if (!current.includes(entry.name)) {
                    // Never let the reader hide the last line and get an empty frame.
                    return current.length >= bucketed.length - 1
                      ? current
                      : [...current, entry.name];
                  }
                  return current.filter((name) => name !== entry.name);
                })
              }
              className={cn(
                "group flex items-start gap-2 rounded-xl px-1.5 py-1 text-left transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lead",
                isHidden ? "opacity-40" : "opacity-100",
              )}
              title={
                isHidden ? `Show ${entry.name.toLowerCase()}` : `Hide ${entry.name.toLowerCase()}`
              }
            >
              <span
                aria-hidden
                className="mt-[7px] h-[3px] w-4 shrink-0 rounded-full"
                style={{ background: colourOf(entry.name) }}
              />
              <span className="flex flex-col">
                <span className="text-[12px] font-medium text-dim">{entry.name}</span>
                <span className="flex items-baseline gap-1.5">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={`${entry.name}-${summary.total}`}
                      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -5 }}
                      transition={{ duration: 0.22 }}
                      className="text-[24px] font-semibold leading-tight tracking-tight tabular-nums text-ink"
                    >
                      {formatCount(summary.total)}
                    </motion.span>
                  </AnimatePresence>
                  {summary.change && (
                    <span
                      className={cn(
                        "text-[11px] font-semibold",
                        summary.change.direction > 0
                          ? "text-go"
                          : summary.change.direction < 0
                            ? "text-stop"
                            : "text-dim",
                      )}
                      title="Against the same length of time just before this window"
                    >
                      {summary.change.text}
                    </span>
                  )}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {!hasData ? (
        <div className="flex min-h-[200px] flex-1 items-center justify-center">
          <p className="max-w-xs text-center text-sm text-dim">{emptyMessage}</p>
        </div>
      ) : (
        <>
          <div
            ref={measure}
            role="img"
            tabIndex={0}
            aria-label={`${title}. ${bucketed
              .map((entry, index) => `${entry.name}: ${formatCount(totals[index].total)}`)
              .join(", ")} over ${selected.label.toLowerCase()}. Use the left and right arrow keys to read each point.`}
            aria-describedby={`${reactId}-table`}
            className="relative mt-3 min-h-[220px] w-full flex-1 touch-none select-none rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lead"
            onPointerMove={handlePointer}
            onPointerDown={handlePointer}
            onPointerLeave={() => setActive(null)}
            onKeyDown={handleKey}
            onBlur={() => setActive(null)}
          >
            {size.width > 0 && (
              <svg
                width={size.width}
                height={size.height}
                className="absolute inset-0 overflow-visible"
              >
                {/* Gridlines: solid hairlines, one step off the surface. */}
                {ticks.map((tick) => (
                  <line
                    key={`grid-${tick}`}
                    x1={plotLeft}
                    x2={plotLeft + plotWidth}
                    y1={toY(tick)}
                    y2={toY(tick)}
                    stroke="currentColor"
                    strokeWidth={1}
                    className={tick === 0 ? "text-ink/[0.14]" : "text-ink/[0.06]"}
                  />
                ))}

                {/* The unit, kept attached to the axis it belongs to. */}
                {unit && (
                  <text
                    x={plotLeft - 10}
                    y={plotTop - 12}
                    textAnchor="end"
                    className="fill-foreground/35 text-[10px]"
                  >
                    {unit}
                  </text>
                )}

                {/* Y-axis labels, on the left where a reader looks for them. */}
                {ticks.map((tick) => (
                  <text
                    key={`ytick-${tick}`}
                    x={plotLeft - 10}
                    y={toY(tick)}
                    textAnchor="end"
                    dominantBaseline="middle"
                    className="fill-foreground/45 text-[11px] tabular-nums"
                  >
                    {formatCompactCount(tick)}
                  </text>
                ))}

                {/* X-axis labels along the bottom. */}
                {xTicks.map((index, position) => (
                  <text
                    key={`xtick-${index}`}
                    x={toX(index)}
                    y={plotBottom + 18}
                    textAnchor={
                      position === 0 ? "start" : position === xTicks.length - 1 ? "end" : "middle"
                    }
                    className="fill-foreground/45 text-[11px]"
                  >
                    {formatAxisDate(bucketed[0].data[index], spansYears)}
                  </text>
                ))}

                {/* Crosshair: readers aim at a date, not at a 2px line. */}
                {activeIndex !== null && (
                  <motion.line
                    initial={false}
                    animate={{ x1: toX(activeIndex), x2: toX(activeIndex) }}
                    transition={spring(450, 32)}
                    y1={plotTop - 4}
                    y2={plotBottom}
                    stroke="currentColor"
                    strokeWidth={1}
                    className="text-faint"
                  />
                )}

                {view === "bars"
                  ? visible.map((entry, position) => {
                      const slot = plotWidth / Math.max(length, 1);
                      const width = Math.max(
                        Math.min((slot * 0.8) / visible.length - 2, BAR_MAX_W),
                        1,
                      );
                      const groupWidth = width * visible.length + 2 * (visible.length - 1);
                      const colour = colourOf(entry.name);
                      return (
                        <g key={entry.name}>
                          {entry.data.map((point, index) => {
                            const x = toX(index) - groupWidth / 2 + position * (width + 2);
                            return (
                              <motion.path
                                key={point.end}
                                d={columnPath(x, toY(point.value), width, plotBottom)}
                                initial={
                                  reduceMotion
                                    ? false
                                    : { d: columnPath(x, plotBottom, width, plotBottom) }
                                }
                                animate={{
                                  d: columnPath(x, toY(point.value), width, plotBottom),
                                  opacity:
                                    activeIndex === null || activeIndex === index ? 1 : 0.4,
                                }}
                                transition={spring(380, 30)}
                                fill={colour}
                              />
                            );
                          })}
                        </g>
                      );
                    })
                  : visible.map((entry) => {
                      const path = splinePath(
                        entry.data.map((point, index) => ({
                          x: toX(index),
                          y: toY(point.value),
                        })),
                      );
                      return (
                        <motion.path
                          key={entry.name}
                          /*
                           * `d` is set as an attribute as well as animated:
                           * Motion morphs from what is already on the element,
                           * so an animate-only path renders nothing until the
                           * first frame, which is every server render.
                           */
                          d={path}
                          initial={false}
                          animate={{ d: path }}
                          transition={reduceMotion ? { duration: 0 } : { duration: 0.6, ease: EASE }}
                          fill="none"
                          stroke={colourOf(entry.name)}
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      );
                    })}

                {/* End-of-line labels: identity without colour-matching. */}
                {view === "curve" &&
                  endLabels.map((label) => (
                    <g key={`end-${label.name}`}>
                      {Math.abs(label.y - label.anchor) > 1 && (
                        <line
                          x1={plotLeft + plotWidth}
                          y1={label.anchor}
                          x2={plotLeft + plotWidth + 8}
                          y2={label.y}
                          stroke={colourOf(label.name)}
                          strokeWidth={1}
                          opacity={0.5}
                        />
                      )}
                      <circle
                        cx={plotLeft + plotWidth}
                        cy={label.anchor}
                        r={3.5}
                        fill={colourOf(label.name)}
                        className="stroke-card"
                        strokeWidth={2}
                      />
                      <text
                        x={plotLeft + plotWidth + 11}
                        y={label.y}
                        dominantBaseline="middle"
                        className="fill-foreground/55 text-[11px] font-medium"
                      >
                        {label.name.replace(/^clients\s+/i, "")}
                      </text>
                    </g>
                  ))}

                {/* Markers on the read point, ringed in the surface colour. */}
                {view === "curve" &&
                  activeIndex !== null &&
                  visible.map((entry) => {
                    const point = entry.data[Math.min(activeIndex, entry.data.length - 1)];
                    if (!point) return null;
                    return (
                      <motion.circle
                        key={`dot-${entry.name}`}
                        initial={false}
                        animate={{ cx: toX(activeIndex), cy: toY(point.value) }}
                        transition={spring(450, 30)}
                        r={4.5}
                        fill={colourOf(entry.name)}
                        className="stroke-card"
                        strokeWidth={2}
                      />
                    );
                  })}
              </svg>
            )}

            {/* Tooltip: every series at that date, values leading. */}
            <AnimatePresence>
              {activeIndex !== null && activeBucket && size.width > 0 && (
                <motion.div
                  className="pointer-events-none absolute z-50"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ left: toX(activeIndex), top: plotTop, opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{
                    left: spring(450, 32),
                    opacity: { duration: 0.15 },
                    scale: { duration: 0.15 },
                  }}
                  style={{
                    translate:
                      toX(activeIndex) > plotLeft + plotWidth / 2
                        ? "calc(-100% - 12px) 0"
                        : "12px 0",
                  }}
                >
                  <div className="min-w-[150px] rounded-xl border border-rule bg-popover/95 px-3.5 py-2.5 shadow-[0_8px_24px_color-mix(in_oklab,var(--ink)_12%,transparent)] backdrop-blur-md">
                    <p className="whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.1em] text-dim">
                      {formatBucketRange(activeBucket)}
                    </p>
                    <div className="mt-1.5 space-y-1">
                      {bucketed.map((entry) => (
                        <div
                          key={entry.name}
                          className="flex items-center justify-between gap-4 whitespace-nowrap text-[13px]"
                        >
                          <span className="flex items-center gap-1.5 text-[12px] text-dim">
                            <span
                              aria-hidden
                              className="h-[3px] w-3 rounded-full"
                              style={{ background: colourOf(entry.name) }}
                            />
                            {entry.name}
                          </span>
                          <span className="font-semibold tabular-nums text-ink">
                            {formatCount(
                              entry.data[Math.min(activeIndex, entry.data.length - 1)]?.value ?? 0,
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* The same numbers without the chart, for screen readers. A table
              keeps its content width whatever `sr-only` sets, so the hiding
              is done by a wrapper that can actually shrink to 1px. */}
          <div className="sr-only">
            <table id={`${reactId}-table`}>
              <caption>{`${title}: ${grainNote} over ${selected.label.toLowerCase()}`}</caption>
              <thead>
                <tr>
                  <th scope="col">Period</th>
                  {bucketed.map((entry) => (
                    <th key={entry.name} scope="col">
                      {entry.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bucketed[0].data.map((point, index) => (
                  <tr key={point.end}>
                    <th scope="row">{formatBucketRange(point)}</th>
                    {bucketed.map((entry) => (
                      <td key={entry.name}>{formatCount(entry.data[index]?.value ?? 0)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default PipelineChart;
