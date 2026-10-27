"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotionConfig } from "motion/react";

import { cn } from "@/lib/utils";
import { StickProgressBar } from "../stick-progress-bar/stick-progress-bar";

/** One kind of work the money went on. Order is the stacking order, bottom up. */
export type AiCostCategory = {
  id: string;
  label: string;
  /** Any CSS colour; keep it a token (`var(--lead)`). */
  color: string;
};

/** One day's priced spend, split by category id. Days with nothing may be left out. */
export type AiCostDay = {
  /** ISO day, YYYY-MM-DD (UTC). */
  date: string;
  byCategory: Record<string, number>;
};

/** Everything the card shows for one window. Switching windows only re-reads these. */
export type AiCostReading = {
  id: string;
  /** The pill: "7D", "30D", "ALL". */
  pill: string;
  /** Plain words for the window, read by screen readers: "Past 30 days". */
  label: string;
  /** What the change is measured against, after "on": "the 30 days before". */
  comparison: string;
  /** First and last ISO day of the window, inclusive. */
  from: string;
  to: string;
  /** Priced cost in the window. */
  costUsd: number;
  /** Priced cost in the equal-length stretch before; 0 means nothing to compare with. */
  priorCostUsd: number;
  /** AI requests in the window, priced or not. */
  requests: number;
  /** Of those, how many carried no cost, so the headline is a floor. */
  unpriced?: number;
  /** Requests the provider refused because a usage limit was reached. */
  refused?: number;
  totalTokens?: number;
  /** Distinct models used in the window. */
  models?: string[];
  /** Per category: priced cost and request count. A category that ran unpriced keeps its row. */
  byCategory: Record<string, { costUsd: number; requests: number }>;
  spendByDay: AiCostDay[];
  /** A caveat that belongs to this window ("searches are only counted from 3 Oct"). */
  note?: ReactNode;
};

export interface AiCostCardProps {
  readings: AiCostReading[];
  categories: AiCostCategory[];
  /** Window selected at first render. Default the first reading. */
  defaultReadingId?: string;
  onReadingChange?: (id: string) => void;
  title?: ReactNode;
  /** Header action. Rendered as a plain link when given. */
  href?: string;
  linkLabel?: ReactNode;
  /** Under the headline: why this is an estimate and not the bill. */
  estimateNote?: ReactNode;
  unpricedNote?: (count: number) => ReactNode;
  refusedNote?: (count: number) => ReactNode;
  /** Money formatting. Default USD to 2dp, "<$0.01" for a sub-cent cost. */
  formatCost?: (value: number) => string;
  className?: string;
}

const EASE = [0.2, 0.7, 0.2, 1] as const;
const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const PLOT_HEIGHT = 252;
const TOP = 8;
const BOTTOM = 26;
const GUTTER = 48;
const RIGHT = 8;
const TICKS = 5;
/** Sticks in the busiest column: enough that a 3px stick plus gap fills the plot. */
const MAX_STICKS = 36;
const STICK_HEIGHT = 3;
const STICK_PITCH = 6;
/** Past this many columns the cascade is hundreds of animated nodes, so draw plain sticks. */
const ANIMATED_COLUMN_LIMIT = 31;
/** Above this many days a window groups into weeks; past the next, months. */
const WEEKLY_ABOVE_DAYS = 31;
const MONTHLY_ABOVE_DAYS = 120;

const USD = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function formatUsd(value: number): string {
  if (value > 0 && value < 0.01) return "<$0.01";
  return `$${USD.format(value)}`;
}

/** "58%", and "<1%" rather than a round zero for a category that cost something. */
function formatShare(share: number): string {
  if (share <= 0) return "0%";
  if (share < 0.005) return "<1%";
  return `${Math.round(share * 100 + 1e-9)}%`;
}

function utcDay(isoDay: string): Date {
  return new Date(`${isoDay}T00:00:00Z`);
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** "12 Sep", or "12 Sep 2026" where a window crosses a year. */
function formatDay(day: string, withYear = false): string {
  const date = utcDay(day);
  const label = `${date.getUTCDate()} ${SHORT_MONTHS[date.getUTCMonth()]}`;
  return withYear ? `${label} ${date.getUTCFullYear()}` : label;
}

type Column = {
  key: string;
  label: string;
  tooltipLabel?: string;
  total: number;
  byCategory: Record<string, number>;
};

/** Every day in the window, including the ones with nothing on them. */
function dailyColumns(reading: AiCostReading, withYear: boolean): Column[] {
  const byDay = new Map(reading.spendByDay.map((day) => [day.date, day.byCategory]));
  const columns: Column[] = [];
  const end = utcDay(reading.to).getTime();
  for (let day = utcDay(reading.from); day.getTime() <= end; day.setUTCDate(day.getUTCDate() + 1)) {
    const key = isoDay(day);
    const byCategory = { ...(byDay.get(key) ?? {}) };
    const total = Object.values(byCategory).reduce((sum, v) => sum + v, 0);
    columns.push({ key, label: formatDay(key, withYear), total, byCategory });
  }
  return columns;
}

/** Monday of the ISO week containing `date`. */
function weekStart(date: Date): Date {
  const start = new Date(date);
  const weekday = start.getUTCDay();
  start.setUTCDate(start.getUTCDate() + (weekday === 0 ? -6 : 1 - weekday));
  return start;
}

/** Groups daily columns into Monday-start weeks or calendar months. */
function groupedColumns(days: Column[], granularity: "week" | "month", withYear: boolean): Column[] {
  const order: string[] = [];
  const buckets = new Map<string, { start: Date; end: Date; total: number; byCategory: Record<string, number> }>();
  for (const day of days) {
    const date = utcDay(day.key);
    const key =
      granularity === "week"
        ? isoDay(weekStart(date))
        : `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { start: date, end: date, total: 0, byCategory: {} };
      buckets.set(key, bucket);
      order.push(key);
    }
    bucket.end = date;
    bucket.total += day.total;
    for (const [id, value] of Object.entries(day.byCategory)) {
      bucket.byCategory[id] = (bucket.byCategory[id] ?? 0) + value;
    }
  }
  return order.map((key) => {
    const bucket = buckets.get(key)!;
    if (granularity === "week") {
      const startLabel = formatDay(isoDay(bucket.start), withYear);
      const endLabel = formatDay(isoDay(bucket.end), withYear);
      return {
        key,
        label: startLabel,
        tooltipLabel: startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`,
        total: bucket.total,
        byCategory: bucket.byCategory,
      };
    }
    const month = (style: "short" | "long", year: boolean) =>
      bucket.start.toLocaleDateString("en-GB", {
        month: style,
        year: year ? "numeric" : undefined,
        timeZone: "UTC",
      });
    return {
      key,
      label: month("short", withYear),
      tooltipLabel: month("long", true),
      total: bucket.total,
      byCategory: bucket.byCategory,
    };
  });
}

function niceCeiling(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalised = value / magnitude;
  const step = [1, 2, 2.5, 5, 10].find((candidate) => normalised <= candidate) ?? 10;
  return step * magnitude;
}

/**
 * A column's total dealt into whole sticks across the categories that spent,
 * largest remainder first, stacked in category order so each kind of work sits
 * in the same place on every date.
 */
function dealColumnSticks(
  categoryIds: string[],
  byCategory: Record<string, number>,
  total: number,
  count: number,
): string[] {
  const entries = categoryIds
    .map((id) => ({ id, value: byCategory[id] ?? 0 }))
    .filter((entry) => entry.value > 0);
  if (entries.length === 0 || count <= 0 || total <= 0) return [];

  const exact = entries.map((entry) => (entry.value / total) * count);
  const base = exact.map(Math.floor);
  let rest = count - base.reduce((sum, sticks) => sum + sticks, 0);
  const order = entries
    .map((_, index) => index)
    .sort((a, b) => (exact[b] % 1) - (exact[a] % 1) || entries[b].value - entries[a].value);
  const extra = new Array<number>(entries.length).fill(0);
  for (let round = 0; rest > 0; round += 1) {
    extra[order[round % order.length]] += 1;
    rest -= 1;
  }

  const sticks: string[] = [];
  entries.forEach((entry, index) => {
    for (let stick = 0; stick < base[index] + extra[index]; stick += 1) sticks.push(entry.id);
  });
  return sticks;
}

/** First and last always, and as many evenly spaced dates between as the width holds. */
function xLabelIndices(count: number, width: number): number[] {
  if (count <= 0) return [];
  const capacity = width > 520 ? 6 : width > 380 ? 4 : 3;
  if (count <= capacity) return Array.from({ length: count }, (_, index) => index);
  const indices = new Set<number>();
  for (let slot = 0; slot < capacity; slot += 1) {
    indices.add(Math.round((slot * (count - 1)) / (capacity - 1)));
  }
  return [...indices].sort((a, b) => a - b);
}

/** Lucide's loader-pinwheel, spun while the card arrives and on hover. */
function PinwheelMark({ spinning }: { spinning: boolean }) {
  return (
    <motion.svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-faint"
      aria-hidden="true"
      animate={spinning ? { rotate: 360 } : { rotate: 0 }}
      transition={
        spinning ? { duration: 1.5, ease: "linear", repeat: Infinity, repeatType: "loop" } : { duration: 0 }
      }
    >
      <circle cx={12} cy={12} r={10} />
      <path d="M22 12a1 1 0 0 1-10 0 1 1 0 0 0-10 0" />
      <path d="M7 20.7a1 1 0 1 1 5-8.7 1 1 0 1 0 5-8.6" />
      <path d="M7 3.3a1 1 0 1 1 5 8.6 1 1 0 1 0 5 8.6" />
    </motion.svg>
  );
}

const defaultEstimateNote = (
  <>
    What this use would cost at the provider&rsquo;s standard paid rates. On a free tier, the actual bill can be $0.
  </>
);

const defaultUnpricedNote = (count: number) => (
  <>
    {count.toLocaleString()} {count === 1 ? "request has" : "requests have"} no cost we could work out: the provider
    didn&rsquo;t report its size, or the model has no price on file. The figure above is a minimum.
  </>
);

const defaultRefusedNote = (count: number) => (
  <>
    The provider turned away {count.toLocaleString()} AI {count === 1 ? "request" : "requests"} in this period because
    the project reached its usage limit.
  </>
);

export function AiCostCard({
  readings,
  categories,
  defaultReadingId,
  onReadingChange,
  title = "Estimated AI cost",
  href,
  linkLabel = "View all generations",
  estimateNote = defaultEstimateNote,
  unpricedNote = defaultUnpricedNote,
  refusedNote = defaultRefusedNote,
  formatCost = formatUsd,
  className,
}: AiCostCardProps) {
  const headingId = useId();
  const reduceMotion = useReducedMotionConfig() ?? false;
  const [readingId, setReadingId] = useState(defaultReadingId ?? readings[0]?.id);
  const [hovered, setHovered] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [iconIntro, setIconIntro] = useState(true);
  const [iconHover, setIconHover] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIconIntro(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const measure = (measured: number) => {
      if (measured > 0) setWidth(measured);
    };
    measure(node.getBoundingClientRect().width);
    const observer = new ResizeObserver(([entry]) => {
      if (entry) measure(entry.contentRect.width);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const reading = readings.find((candidate) => candidate.id === readingId) ?? readings[0];
  if (!reading) return null;

  const categoryIds = categories.map((category) => category.id);
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const colorOf = (id: string) => categoryById.get(id)?.color ?? "var(--faint)";
  const labelOf = (id: string) => categoryById.get(id)?.label ?? id;

  const hasPriced = reading.costUsd > 0;

  // Categories that ran, largest cost first; those that ran unpriced stay, at the end.
  const rows = categories
    .map((category) => {
      const totals = reading.byCategory[category.id] ?? { costUsd: 0, requests: 0 };
      return {
        ...category,
        costUsd: totals.costUsd,
        requests: totals.requests,
        share: reading.costUsd > 0 ? totals.costUsd / reading.costUsd : 0,
      };
    })
    .filter((row) => row.requests > 0 || row.costUsd > 0)
    .sort((a, b) => b.costUsd - a.costUsd || categoryIds.indexOf(a.id) - categoryIds.indexOf(b.id));

  const gaugeSegments = rows
    .filter((row) => row.costUsd > 0)
    .map((row) => ({ id: row.id, label: row.label, value: row.costUsd, color: row.color }));

  const withYear = reading.from.slice(0, 4) !== reading.to.slice(0, 4);
  const range = `${formatDay(reading.from, withYear)} – ${formatDay(reading.to, withYear)}`;
  const rawDays = dailyColumns(reading, withYear);
  const granularity =
    rawDays.length <= WEEKLY_ABOVE_DAYS ? "day" : rawDays.length <= MONTHLY_ABOVE_DAYS ? "week" : "month";
  const columns = granularity === "day" ? rawDays : groupedColumns(rawDays, granularity, withYear);
  const totals = columns.map((column) => column.total);
  const max = niceCeiling(Math.max(...totals, 0) / (TICKS - 1)) * (TICKS - 1);
  const hasSpend = totals.some((total) => total > 0);
  const busiest = columns.reduce<Column | null>(
    (result, column) => (result && result.total >= column.total ? result : column),
    null,
  );

  const plotWidth = Math.max(1, width - GUTTER - RIGHT);
  const plotHeight = PLOT_HEIGHT - TOP - BOTTOM;
  const baseline = TOP + plotHeight;
  const slot = plotWidth / Math.max(1, columns.length);
  const stickWidth = Math.max(1, Math.min(18, slot - 1));
  const centre = (index: number) => GUTTER + slot * (index + 0.5);
  const animateCascade = !reduceMotion && columns.length <= ANIMATED_COLUMN_LIMIT;
  const labelled = xLabelIndices(columns.length, width);

  const hoveredColumn = hovered !== null ? columns[hovered] : null;
  const hoveredLeftPct = hovered !== null ? (centre(hovered) / Math.max(1, width)) * 100 : 0;

  const splitOf = (column: Column) =>
    categoryIds
      .map((id) => ({ id, value: column.byCategory[id] ?? 0 }))
      .filter((entry) => entry.value > 0)
      .sort((a, b) => b.value - a.value);

  return (
    <section
      aria-labelledby={headingId}
      className={cn("@container overflow-hidden rounded-panel border border-rule bg-card font-body shadow-sm", className)}
    >
      <div className="flex items-center justify-between gap-4 border-b border-rule-soft px-5 py-3.5 sm:px-6">
        <h2 id={headingId} className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.01em] text-ink">
          <span
            className="inline-flex"
            onPointerEnter={() => setIconHover(true)}
            onPointerLeave={() => setIconHover(false)}
          >
            <PinwheelMark spinning={!reduceMotion && (iconIntro || iconHover)} />
          </span>
          {title}
        </h2>
        {href && (
          <a
            href={href}
            className="shrink-0 rounded-inset bg-lead px-3 py-1.5 text-[13px] font-semibold text-on-solid transition-colors hover:bg-lead/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {linkLabel}
          </a>
        )}
      </div>

      <div className="grid items-start gap-x-6 gap-y-4 px-5 pt-4 sm:px-6 @lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-[30px] leading-none font-bold tracking-[-0.02em] tabular-nums text-ink">
              {formatCost(reading.costUsd)}
            </span>
            <span className="text-sm leading-[1.55] text-dim">
              {reading.requests === 0
                ? "no AI use in this stretch"
                : `across ${reading.requests.toLocaleString()} AI ${reading.requests === 1 ? "request" : "requests"}`}
            </span>
          </p>
          <Stacked readings={readings} activeId={reading.id} className="mt-1.5">
            {(candidate) => <ChangeLine reading={candidate} />}
          </Stacked>
        </div>

        {readings.length > 1 && (
          <div className="flex min-w-0 flex-col items-start gap-2.5 @lg:items-end">
            <div
              role="group"
              aria-label="How far back these figures look"
              className="flex max-w-full items-center gap-0.5 overflow-x-auto rounded-[10px] bg-paper p-1"
            >
              {readings.map((candidate) => {
                const selected = candidate.id === reading.id;
                return (
                  <button
                    key={candidate.id}
                    type="button"
                    aria-pressed={selected}
                    aria-label={candidate.label}
                    onClick={() => {
                      setReadingId(candidate.id);
                      setHovered(null);
                      onReadingChange?.(candidate.id);
                    }}
                    className={cn(
                      "shrink-0 cursor-pointer rounded-[7px] px-3.5 py-1.5 text-[13px] font-semibold outline-none transition-all focus-visible:ring-2 focus-visible:ring-lead",
                      selected ? "bg-card text-ink shadow-sm" : "text-dim hover:text-ink",
                    )}
                  >
                    {candidate.pill}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* The window's split as horizontal sticks, with the figures in the legend. */}
      {estimateNote && (
        <p className="px-5 pt-3 text-[12.5px] leading-[1.55] text-dim sm:px-6">{estimateNote}</p>
      )}

      <div className="px-5 pt-8 pb-6 sm:px-6 sm:pb-8">
        <h3 className="text-[14px] font-semibold text-ink">What it went on</h3>
        {hasPriced ? (
          <>
            <div className="mt-2.5">
              <StickProgressBar
                key={reading.id}
                segments={gaugeSegments}
                ariaLabel={`What this window's estimated AI cost went on, ${reading.label.toLowerCase()}`}
                valueFormatter={formatCost}
              />
            </div>
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
              {rows.map((row) => (
                <li key={row.id} className="flex items-center gap-1.5 text-[12.5px] leading-none">
                  <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full" style={{ background: row.color }} />
                  <span className="text-dim">{row.label}</span>
                  {row.costUsd > 0 ? (
                    <>
                      <span className="font-semibold tabular-nums text-ink">{formatCost(row.costUsd)}</span>
                      <span className="tabular-nums text-dim">{formatShare(row.share)}</span>
                    </>
                  ) : (
                    <span className="text-dim">no cost recorded</span>
                  )}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-2 text-[13px] leading-[1.55] text-dim">
            {reading.requests === 0
              ? "No generation ran in this stretch, so there is nothing to split."
              : "Nothing in this stretch has been priced yet, so there is no split to show."}
          </p>
        )}
      </div>

      {/* One stacked-stick column per date, height against the dollar axis. */}
      <div ref={containerRef} className="relative mx-2 mt-2 mb-4 px-3 sm:mx-4" style={{ height: PLOT_HEIGHT }}>
        {width > 0 && (
          <svg
            role="img"
            aria-label={
              hasSpend && busiest
                ? `Estimated AI cost by date, ${range}. Busiest ${busiest.tooltipLabel ?? busiest.label}, ${formatCost(busiest.total)}.`
                : `Estimated AI cost by date, ${range}`
            }
            className="block w-full"
            height={PLOT_HEIGHT}
          >
            {Array.from({ length: TICKS }, (_, index) => {
              const value = (max / (TICKS - 1)) * index;
              const y = baseline - (plotHeight / (TICKS - 1)) * index;
              return (
                <g key={index}>
                  <line x1={GUTTER} x2={GUTTER + plotWidth} y1={y} y2={y} stroke="var(--rule-soft)" strokeDasharray="4 4" />
                  <text x={GUTTER - 8} y={y + 3.5} textAnchor="end" fill="var(--faint)" className="font-body text-[10.5px]">
                    {formatCost(value)}
                  </text>
                </g>
              );
            })}

            {columns.map((column, index) => {
              const total = totals[index] ?? 0;
              const count = total > 0 && max > 0 ? Math.max(1, Math.round((total / max) * MAX_STICKS)) : 0;
              const sticks = dealColumnSticks(categoryIds, column.byCategory, total, count);
              const split = splitOf(column);
              return (
                <g key={`${reading.id}-${column.key}`}>
                  {hovered === index && (
                    <rect
                      x={GUTTER + slot * index + 2}
                      y={TOP - 4}
                      width={Math.max(1, slot - 4)}
                      height={plotHeight + 8}
                      rx={8}
                      fill="var(--paper)"
                      opacity={0.7}
                    />
                  )}
                  {sticks.map((id, stickIndex) => {
                    const geometry = {
                      x: centre(index) - stickWidth / 2,
                      y: baseline - (stickIndex + 1) * STICK_PITCH + (STICK_PITCH - STICK_HEIGHT),
                      width: stickWidth,
                      height: STICK_HEIGHT,
                      rx: 1.5,
                      fill: colorOf(id),
                    };
                    return animateCascade ? (
                      <motion.rect
                        key={stickIndex}
                        {...geometry}
                        // Fill-up cascade: delaying by stick index lays each
                        // column bottom to top, one column after the previous.
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.28,
                          ease: EASE,
                          delay: Math.min(index * 0.05, 0.45) + Math.min(stickIndex * 0.022, 0.7),
                        }}
                      />
                    ) : (
                      <rect key={stickIndex} {...geometry} />
                    );
                  })}
                  {labelled.includes(index) && (
                    <text
                      x={index === 0 ? GUTTER : index === columns.length - 1 ? GUTTER + plotWidth : centre(index)}
                      y={baseline + 17}
                      textAnchor={index === 0 ? "start" : index === columns.length - 1 ? "end" : "middle"}
                      fill="var(--faint)"
                      className="font-body text-[10.5px]"
                    >
                      {column.label}
                    </text>
                  )}
                  <rect
                    x={GUTTER + slot * index}
                    y={TOP}
                    width={slot}
                    height={plotHeight}
                    fill="transparent"
                    pointerEvents="all"
                    onPointerEnter={() => setHovered(index)}
                    onPointerLeave={() => setHovered((current) => (current === index ? null : current))}
                  >
                    <title>
                      {`${column.tooltipLabel ?? column.label}: ${formatCost(total)}${
                        split.length > 1
                          ? ` — ${split.map((entry) => `${labelOf(entry.id)} ${formatCost(entry.value)}`).join(", ")}`
                          : ""
                      }`}
                    </title>
                  </rect>
                </g>
              );
            })}

            {!hasSpend && (
              <text
                x={GUTTER + plotWidth / 2}
                y={baseline - plotHeight / 2}
                textAnchor="middle"
                fill="var(--dim)"
                className="font-body text-[12px]"
              >
                No estimated AI cost in this period
              </text>
            )}
          </svg>
        )}

        {/* Floating tooltip over the hovered column, clamped inside the card. */}
        {hoveredColumn && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-6 z-10 w-60 -translate-x-1/2 rounded-xl border border-rule-soft bg-card px-4 py-3 shadow-lg"
            style={{ left: `max(7.5rem, min(calc(100% - 7.5rem), ${hoveredLeftPct}%))` }}
          >
            <p className="text-[13px] font-bold text-ink">{hoveredColumn.tooltipLabel ?? hoveredColumn.label}</p>
            {splitOf(hoveredColumn).length > 0 ? (
              <ul className="mt-2 space-y-1.5 text-[12.5px]">
                {splitOf(hoveredColumn).map((entry) => (
                  <li key={entry.id} className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-dim">
                      <span className="size-1.5 rounded-full" style={{ background: colorOf(entry.id) }} />
                      {labelOf(entry.id)}:
                    </span>
                    <span className="font-bold tabular-nums text-ink">{formatCost(entry.value)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-[12.5px] text-dim">No cost recorded</p>
            )}
          </div>
        )}
      </div>

      {readings.some(hasFooter) && (
        <Stacked readings={readings} activeId={reading.id} className="px-5 pt-4 pb-5 sm:px-6">
          {(candidate) => (
            <ReadingFooter reading={candidate} unpricedNote={unpricedNote} refusedNote={refusedNote} />
          )}
        </Stacked>
      )}
    </section>
  );
}

/**
 * Every window's version of a block, laid in the same grid cell with only the
 * open one visible. The cell is as tall as the tallest version, so switching
 * windows never changes the card's height.
 */
function Stacked({
  readings,
  activeId,
  className,
  children,
}: {
  readings: AiCostReading[];
  activeId: string;
  className?: string;
  children: (reading: AiCostReading) => ReactNode;
}) {
  return (
    <div className={cn("grid", className)}>
      {readings.map((candidate) => {
        const active = candidate.id === activeId;
        return (
          <div
            key={candidate.id}
            aria-hidden={active ? undefined : true}
            className={cn("col-start-1 row-start-1 min-w-0", !active && "invisible")}
          >
            {children(candidate)}
          </div>
        );
      })}
    </div>
  );
}

function ChangeLine({ reading }: { reading: AiCostReading }) {
  const change =
    reading.priorCostUsd > 0 ? ((reading.costUsd - reading.priorCostUsd) / reading.priorCostUsd) * 100 : null;
  const rising = change !== null && change > 0;
  return (
    <p className="text-[13px] leading-[1.55]">
      {change === null ? (
        <span className="text-dim">No AI cost in {reading.comparison}, so there is nothing to compare this with yet.</span>
      ) : (
        <span className={cn("font-semibold", rising ? "text-stop" : "text-go")}>
          {rising ? "Up" : "Down"} {Math.abs(change).toFixed(0)}% on {reading.comparison}
        </span>
      )}
    </p>
  );
}

function hasFooter(reading: AiCostReading) {
  return reading.requests > 0 || (reading.unpriced ?? 0) > 0 || (reading.refused ?? 0) > 0 || Boolean(reading.note);
}

function ReadingFooter({
  reading,
  unpricedNote,
  refusedNote,
}: {
  reading: AiCostReading;
  unpricedNote: (count: number) => ReactNode;
  refusedNote: (count: number) => ReactNode;
}) {
  const unpriced = reading.unpriced ?? 0;
  const refused = reading.refused ?? 0;
  if (!hasFooter(reading)) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
      {reading.requests > 0 && (
        <p className="text-[13.5px] leading-[1.55] text-dim">
          {(reading.totalTokens ?? 0).toLocaleString()} tokens
          {reading.models?.length ? ` · ${reading.models.join(", ")}` : ""}
        </p>
      )}
      {unpriced > 0 && <p className="text-[12.5px] leading-[1.55] text-dim">{unpricedNote(unpriced)}</p>}
      {refused > 0 && <p className="text-[12.5px] leading-[1.55] font-semibold text-hold">{refusedNote(refused)}</p>}
      {reading.note && <p className="text-[12.5px] leading-[1.55] text-dim">{reading.note}</p>}
    </div>
  );
}

export default AiCostCard;
