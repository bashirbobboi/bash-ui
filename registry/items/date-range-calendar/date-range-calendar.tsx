"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotionConfig } from "motion/react";

import { cn } from "@/lib/utils";

/**
 * A range calendar drawn in the page's own visual language rather than the
 * operating system's: one control for one intention ("these dates"), picked in
 * two clicks on one surface with the span previewed under the cursor.
 *
 * - It cannot dismiss its own parent. A native date picker is browser chrome,
 *   so focus leaving into it reads as focus leaving a popover that closes on
 *   blur. Every element here is a real DOM node inside that subtree.
 * - Days outside `min`/`max` are visibly unavailable, not silently refused.
 * - en-GB, Monday-first, always, whatever the machine's locale says.
 *
 * Everything is a UTC ISO day (`YYYY-MM-DD`): ISO days sort and compare
 * correctly as plain strings, and a local-midnight Date would put a London
 * user's "1 September" an hour before the UTC one.
 *
 * Keyboard: arrows move by a day, PageUp/PageDown by a month, Home/End to the
 * ends of the week, Enter or Space picks. One tab stop with a roving tabIndex,
 * so a keyboard user does not tab through 42 cells.
 */

/* ─── Date rules (pure) ──────────────────────────────────────────────────── */

const DAY_MS = 24 * 60 * 60 * 1000;

/** The house curve: front-loaded, so a press is answered at once. */
const EASE = [0.2, 0.7, 0.2, 1] as const;
/** EASE mirrored: gentle out of rest, accelerating away. For closing. */
const COLLAPSE_EASE = [0.8, 0, 0.3, 0.8] as const;

/** Monday-first. */
const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"] as const;

/**
 * Always six rows. A month needing five would otherwise make the calendar
 * shorter, and a popover that animates its height would resize every time you
 * paged between months.
 */
const GRID_CELLS = 6 * 7;

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** `YYYY-MM`, the calendar's paging unit. */
type MonthKey = string;

type DayCell = { iso: string; dayOfMonth: number; inMonth: boolean };

/** A range in progress or complete. Both ends are UTC ISO days, or null. */
export type RangeSelection = { from: string | null; to: string | null };

/** A one-click shortcut shown under the grid. */
export type CalendarPreset = { label: string; from: string; to: string };

function toIsoDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function todayIso(now: Date = new Date()): string {
  return toIsoDay(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function monthKeyOf(iso: string): MonthKey {
  return iso.slice(0, 7);
}

function addMonths(month: MonthKey, delta: number): MonthKey {
  const year = Number(month.slice(0, 4));
  const index = Number(month.slice(5, 7)) - 1;
  return toIsoDay(Date.UTC(year, index + delta, 1)).slice(0, 7);
}

/** "2026-03-31" into February becomes "2026-02-28". */
function clampDayToMonth(dayIso: string, month: MonthKey): string {
  const year = Number(month.slice(0, 4));
  const index = Number(month.slice(5, 7));
  const day = Number(dayIso.slice(8, 10));
  const lastDay = new Date(Date.UTC(year, index, 0)).getUTCDate();
  return `${month}-${String(Math.min(day, lastDay)).padStart(2, "0")}`;
}

function monthLabel(month: MonthKey): string {
  return `${MONTH_NAMES[Number(month.slice(5, 7)) - 1]} ${month.slice(0, 4)}`;
}

function formatDayLong(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** The 42 cells of a month, Monday-first, borrowing days either side. */
function buildMonthGrid(month: MonthKey): DayCell[] {
  const year = Number(month.slice(0, 4));
  const index = Number(month.slice(5, 7)) - 1;
  const first = Date.UTC(year, index, 1);
  const leading = (new Date(first).getUTCDay() + 6) % 7;
  const start = first - leading * DAY_MS;
  return Array.from({ length: GRID_CELLS }, (_, i) => {
    const ms = start + i * DAY_MS;
    const date = new Date(ms);
    return {
      iso: toIsoDay(ms),
      dayOfMonth: date.getUTCDate(),
      inMonth: date.getUTCMonth() === index && date.getUTCFullYear() === year,
    };
  });
}

type DayFlags = {
  isStart: boolean;
  isEnd: boolean;
  isInside: boolean;
  isPreview: boolean;
  isToday: boolean;
  isDisabled: boolean;
};

/**
 * What one day looks like now. With a start picked and no end, the hovered day
 * stands in for the end, so the user sees the span before committing to it.
 */
function dayFlags(
  iso: string,
  ctx: {
    selection: RangeSelection;
    hover: string | null;
    min?: string | null;
    max?: string | null;
    today: string;
  },
): DayFlags {
  const { selection, hover, min, max, today } = ctx;
  const isDisabled = Boolean((min && iso < min) || (max && iso > max));
  const previewEnd =
    selection.from && !selection.to && hover && !(min && hover < min) && !(max && hover > max)
      ? hover
      : null;
  const end = selection.to ?? previewEnd;

  if (!selection.from || !end) {
    return {
      isStart: selection.from === iso,
      isEnd: false,
      isInside: false,
      isPreview: false,
      isToday: today === iso,
      isDisabled,
    };
  }

  const lo = selection.from <= end ? selection.from : end;
  const hi = selection.from <= end ? end : selection.from;
  const inRange = iso >= lo && iso <= hi;
  return {
    isStart: iso === lo,
    isEnd: iso === hi,
    isInside: inRange && iso !== lo && iso !== hi,
    isPreview: previewEnd !== null,
    isToday: today === iso,
    isDisabled,
  };
}

/**
 * The click rule. Nothing picked, or a full range picked: start over here. A
 * start picked and this day on or after it: close the range. A day BEFORE the
 * start begins a new range rather than silently swapping the ends, because the
 * user clicked meaning "the range begins here".
 */
function nextSelection(current: RangeSelection, clicked: string): RangeSelection {
  if (!current.from || current.to) return { from: clicked, to: null };
  if (clicked < current.from) return { from: clicked, to: null };
  return { from: current.from, to: clicked };
}

/** Usable once both ends exist and run the right way round. */
export function isCompleteRange(
  selection: RangeSelection,
): selection is { from: string; to: string } {
  return Boolean(selection.from && selection.to && selection.from <= selection.to);
}

function rangeLengthDays(from: string, to: string): number {
  return Math.floor((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS) + 1;
}

/**
 * Calendar periods, as opposed to a rolling "past 30 days": "this month" is
 * what a report is written against.
 */
export function calendarPresets(now: Date = new Date()): CalendarPreset[] {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const today = todayIso(now);
  const firstOf = (y: number, m: number) => toIsoDay(Date.UTC(y, m, 1));
  const lastOf = (y: number, m: number) => toIsoDay(Date.UTC(y, m + 1, 1) - DAY_MS);
  return [
    { label: "This month", from: firstOf(year, month), to: today },
    { label: "Last month", from: firstOf(year, month - 1), to: lastOf(year, month - 1) },
    { label: "This quarter", from: firstOf(year, Math.floor(month / 3) * 3), to: today },
  ];
}

/**
 * Clamps a preset to the bounds, or drops it when it falls wholly outside: a
 * shortcut that produces an empty chart reads as broken data.
 */
function clampPreset(
  preset: CalendarPreset,
  min?: string | null,
  max?: string | null,
): CalendarPreset | null {
  const from = min && preset.from < min ? min : preset.from;
  const to = max && preset.to > max ? max : preset.to;
  if (from > to) return null;
  return { ...preset, from, to };
}

/**
 * Keeps an absolutely positioned panel on screen. Use as the panel's ref; it
 * nudges the panel back with margins (not transforms, which Tailwind and Motion
 * both own) when an edge comes within 12px of the viewport.
 */
export function keepInViewport(el: HTMLElement | null): (() => void) | undefined {
  if (!el) return;
  const EDGE = 12;
  const fit = () => {
    el.style.marginLeft = "";
    el.style.marginRight = "";
    const { left, right } = el.getBoundingClientRect();
    const width = document.documentElement.clientWidth;
    let shift = 0;
    if (right > width - EDGE) shift = width - EDGE - right;
    if (left + shift < EDGE) shift = EDGE - left;
    if (shift === 0) return;
    el.style.marginLeft = `${shift}px`;
    el.style.marginRight = `${-shift}px`;
  };
  fit();
  const observer = new ResizeObserver(fit);
  observer.observe(el);
  window.addEventListener("resize", fit);
  return () => {
    observer.disconnect();
    window.removeEventListener("resize", fit);
  };
}

/* ─── The calendar ───────────────────────────────────────────────────────── */

/**
 * Cells fill their grid column rather than carrying a fixed width, so the range
 * track joins into one continuous bar instead of a row of separate blocks.
 */
const CELL = "h-[30px] w-full";

const NAV_BUTTON =
  "grid h-7 w-7 shrink-0 place-items-center rounded-lg text-dim transition-colors hover:bg-paper hover:text-ink disabled:pointer-events-none disabled:opacity-25 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand";

const PANEL =
  "absolute left-1/2 top-9 z-30 w-[270px] max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-xl border border-rule bg-popover p-2.5 shadow-xl backdrop-blur-md";

export type DateRangeCalendarProps = {
  /** Committed selection; drives what is drawn, and where the calendar opens. */
  value: RangeSelection;
  onChange: (selection: RangeSelection) => void;
  /**
   * `"range"` (default) picks a span in two clicks; `"single"` picks one day,
   * reported as `{ from: day, to: day }`.
   */
  mode?: "range" | "single";
  /** Inclusive bounds (ISO days). Days outside are shown but not selectable. */
  min?: string | null;
  max?: string | null;
  /** Fixes "today"; defaults to the real clock. */
  now?: Date;
  /** Shows the shortcut row under the grid. Forced off in single mode. */
  showPresets?: boolean;
  /** Shortcuts to offer. Defaults to This month / Last month / This quarter. */
  presetOptions?: CalendarPreset[];
  className?: string;
};

export function DateRangeCalendar({
  value,
  onChange,
  mode = "range",
  min,
  max,
  now,
  showPresets = true,
  presetOptions,
  className,
}: DateRangeCalendarProps) {
  const reduceMotion = useReducedMotionConfig();
  const today = useMemo(() => todayIso(now ?? new Date()), [now]);

  // Open on the start's month, else the newest month the bounds allow, else
  // today's, so a bounded calendar never opens on a page of greyed-out days.
  const [month, setMonth] = useState<MonthKey>(() =>
    monthKeyOf(value.from ?? (max && max < today ? max : today)),
  );
  const [hover, setHover] = useState<string | null>(null);
  const [focusedDay, setFocusedDay] = useState<string>(() => value.from ?? today);
  const gridRef = useRef<HTMLDivElement>(null);

  const [activeDropdown, setActiveDropdown] = useState<"month" | "year" | null>(null);
  const [yearSearch, setYearSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const yearInputRef = useRef<HTMLInputElement>(null);
  const activeYearRef = useRef<HTMLButtonElement>(null);

  const currentYear = Number(month.slice(0, 4));
  const currentMonthIndex = Number(month.slice(5, 7)) - 1;
  const currentMonthName = MONTH_NAMES[currentMonthIndex] ?? "Month";

  const minYear = min ? Number(min.slice(0, 4)) : 1940;
  const maxYear = max ? Number(max.slice(0, 4)) : new Date().getUTCFullYear() + 5;

  const allYears = useMemo(() => {
    const years: number[] = [];
    for (let y = maxYear; y >= minYear; y -= 1) years.push(y);
    return years;
  }, [minYear, maxYear]);

  const filteredYears = useMemo(() => {
    const query = yearSearch.trim();
    return query ? allYears.filter((y) => String(y).includes(query)) : allYears;
  }, [allYears, yearSearch]);

  useEffect(() => {
    if (activeDropdown !== "year") return;
    requestAnimationFrame(() => {
      yearInputRef.current?.focus();
      yearInputRef.current?.select();
      activeYearRef.current?.scrollIntoView({ block: "center", behavior: "auto" });
    });
  }, [activeDropdown]);

  useEffect(() => {
    if (!activeDropdown) return;
    const onPointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    // Escape closes the month/year panel only, not a popover around the calendar.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        event.preventDefault();
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [activeDropdown]);

  const jumpTo = (next: MonthKey) => {
    setMonth(next);
    setFocusedDay((prev) => clampDayToMonth(prev, next));
    setActiveDropdown(null);
  };

  const handleYearSearchSubmit = (event?: React.FormEvent) => {
    event?.preventDefault();
    const year = Number(yearSearch.trim());
    const pick =
      !Number.isNaN(year) && year >= minYear && year <= maxYear ? year : filteredYears[0];
    if (pick !== undefined) {
      jumpTo(`${pick}-${String(currentMonthIndex + 1).padStart(2, "0")}`);
    }
  };

  /** Split into weeks so the grid carries real role="row" elements. */
  const weeks = useMemo(() => {
    const cells = buildMonthGrid(month);
    const rows: DayCell[][] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [month]);

  const presets = useMemo(() => {
    if (!showPresets || mode === "single") return [];
    return (presetOptions ?? calendarPresets(now ?? new Date()))
      .map((preset) => clampPreset(preset, min, max))
      .filter((preset): preset is CalendarPreset => preset !== null);
  }, [showPresets, mode, now, presetOptions, min, max]);

  // Paging is disabled at the edges rather than allowed and then empty.
  const previousMonth = addMonths(month, -1);
  const nextMonth = addMonths(month, 1);
  const canGoBack = !min || `${previousMonth}-31` >= min;
  const canGoForward = !max || `${nextMonth}-01` <= max;

  const selectDay = (iso: string) => {
    onChange(mode === "single" ? { from: iso, to: iso } : nextSelection(value, iso));
    setFocusedDay(iso);
  };

  /** Moves focus by whole days, paging the visible month when it crosses out. */
  const moveFocus = (deltaDays: number, deltaMonths = 0) => {
    let target = focusedDay;
    if (deltaMonths !== 0) {
      target = clampDayToMonth(focusedDay, addMonths(monthKeyOf(focusedDay), deltaMonths));
    }
    if (deltaDays !== 0) {
      target = toIsoDay(Date.parse(`${target}T00:00:00Z`) + deltaDays * DAY_MS);
    }
    if (min && target < min) target = min;
    if (max && target > max) target = max;

    setFocusedDay(target);
    if (monthKeyOf(target) !== month) setMonth(monthKeyOf(target));
    requestAnimationFrame(() => {
      gridRef.current?.querySelector<HTMLButtonElement>(`[data-day="${target}"]`)?.focus();
    });
  };

  const onGridKeyDown = (event: React.KeyboardEvent) => {
    const weekday = (new Date(`${focusedDay}T00:00:00Z`).getUTCDay() + 6) % 7;
    const keyed: Record<string, () => void> = {
      ArrowLeft: () => moveFocus(-1),
      ArrowRight: () => moveFocus(1),
      ArrowUp: () => moveFocus(-7),
      ArrowDown: () => moveFocus(7),
      PageUp: () => moveFocus(0, -1),
      PageDown: () => moveFocus(0, 1),
      Home: () => moveFocus(-weekday),
      End: () => moveFocus(6 - weekday),
    };
    const handler = keyed[event.key];
    if (handler) {
      event.preventDefault();
      // Navigation keys stop here; Escape is left to close a parent popover.
      event.stopPropagation();
      handler();
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
      if (!(min && focusedDay < min) && !(max && focusedDay > max)) selectDay(focusedDay);
    }
  };

  const readout = (() => {
    if (mode === "single") return value.from ? formatDayLong(value.from) : "Pick a date";
    if (!value.from) return "Pick a start date";
    if (!value.to) return "Now pick an end date";
    const days = rangeLengthDays(value.from, value.to);
    return `${days} day${days === 1 ? "" : "s"} selected`;
  })();

  const panelMotion = {
    initial: reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -6, filter: "blur(4px)" },
    animate: reduceMotion
      ? { opacity: 1, transition: { duration: 0.15 } }
      : {
          opacity: 1,
          scale: 1,
          y: 0,
          filter: "blur(0px)",
          transition: { duration: 0.22, ease: EASE },
        },
    exit: reduceMotion
      ? { opacity: 0, transition: { duration: 0.1 } }
      : {
          opacity: 0,
          scale: 0.96,
          y: -4,
          filter: "blur(3px)",
          transition: { duration: 0.18, ease: COLLAPSE_EASE },
        },
  };

  const headerButton = (open: boolean) =>
    cn(
      "flex cursor-pointer items-center gap-1 rounded-lg py-1 text-[14px] font-bold tracking-tight text-ink transition-colors focus-visible:outline-2 focus-visible:outline-brand",
      open ? "bg-brand/15" : "hover:bg-paper",
    );

  const chevron = (open: boolean) => (
    <ChevronDown
      size={13}
      strokeWidth={2.5}
      className={cn(
        "opacity-45 transition-transform duration-200",
        open && "rotate-180 opacity-100",
      )}
    />
  );

  const panelHeader = (label: string, close: string) => (
    <div className="mb-2 flex items-center justify-between border-b border-rule-soft pb-1.5">
      <span className="text-[11px] font-bold uppercase tracking-wider text-dim">{label}</span>
      <button
        type="button"
        aria-label={close}
        onClick={() => setActiveDropdown(null)}
        className="grid h-5 w-5 place-items-center rounded text-faint hover:text-ink"
      >
        <X size={12} strokeWidth={2.5} />
      </button>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={cn("relative font-body", className)}
      onMouseLeave={() => setHover(null)}
    >
      {/* Month and year header */}
      <div className="flex items-center justify-between gap-1 px-0.5">
        <button
          type="button"
          aria-label={`Previous month, ${monthLabel(previousMonth)}`}
          disabled={!canGoBack}
          onClick={() => {
            setMonth(previousMonth);
            setActiveDropdown(null);
          }}
          className={NAV_BUTTON}
        >
          <ChevronLeft size={16} strokeWidth={2.5} />
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-haspopup="dialog"
            aria-expanded={activeDropdown === "month"}
            aria-label={`Select month, currently ${currentMonthName}`}
            onClick={() => setActiveDropdown((curr) => (curr === "month" ? null : "month"))}
            className={cn(headerButton(activeDropdown === "month"), "px-2.5")}
          >
            <span>{currentMonthName}</span>
            {chevron(activeDropdown === "month")}
          </button>
          <button
            type="button"
            aria-haspopup="dialog"
            aria-expanded={activeDropdown === "year"}
            aria-label={`Select year, currently ${currentYear}`}
            onClick={() => {
              setYearSearch("");
              setActiveDropdown((curr) => (curr === "year" ? null : "year"));
            }}
            className={cn(headerButton(activeDropdown === "year"), "px-2 tabular-nums")}
          >
            <span>{currentYear}</span>
            {chevron(activeDropdown === "year")}
          </button>
        </div>

        <button
          type="button"
          aria-label={`Next month, ${monthLabel(nextMonth)}`}
          disabled={!canGoForward}
          onClick={() => {
            setMonth(nextMonth);
            setActiveDropdown(null);
          }}
          className={NAV_BUTTON}
        >
          <ChevronRight size={16} strokeWidth={2.5} />
        </button>
      </div>

      {/* Month and year panels */}
      <AnimatePresence>
        {activeDropdown === "month" && (
          <motion.div key="month" {...panelMotion} ref={keepInViewport} className={PANEL}>
            {panelHeader(`Select month (${currentYear})`, "Close month dropdown")}
            <div className="grid grid-cols-2 gap-1">
              {MONTH_NAMES.map((name, index) => {
                const isSelected = index === currentMonthIndex;
                const key = `${currentYear}-${String(index + 1).padStart(2, "0")}`;
                const isDisabled = Boolean(
                  (min && `${key}-31` < min) || (max && `${key}-01` > max),
                );
                return (
                  <button
                    key={name}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => jumpTo(key)}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold transition-colors",
                      isSelected ? "bg-brand font-bold text-on-solid" : "text-ink hover:bg-paper",
                      isDisabled && "pointer-events-none opacity-25",
                    )}
                  >
                    <span>{name}</span>
                    {isSelected && <Check size={12} strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {activeDropdown === "year" && (
          <motion.div key="year" {...panelMotion} ref={keepInViewport} className={PANEL}>
            {panelHeader("Select or type year", "Close year dropdown")}

            <form onSubmit={handleYearSearchSubmit} className="mb-2 flex items-center gap-1.5">
              <div className="relative flex-1">
                <input
                  ref={yearInputRef}
                  type="text"
                  inputMode="numeric"
                  aria-label="Year"
                  placeholder="Type year (e.g. 2021)…"
                  value={yearSearch}
                  onChange={(event) =>
                    setYearSearch(event.target.value.replace(/[^0-9]/g, "").slice(0, 4))
                  }
                  className="w-full rounded-md border border-rule bg-card px-2.5 py-1 font-mono text-xs text-ink placeholder:text-faint focus:border-brand focus:outline-none"
                />
                {yearSearch && (
                  <button
                    type="button"
                    aria-label="Clear year"
                    onClick={() => setYearSearch("")}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-faint hover:text-ink"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={!yearSearch.trim()}
                className="rounded-md bg-brand px-2.5 py-1 text-xs font-bold text-on-solid transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                Jump
              </button>
            </form>

            <div className="grid max-h-44 grid-cols-3 gap-1 overflow-y-auto pr-1">
              {filteredYears.map((y) => {
                const isSelected = y === currentYear;
                return (
                  <button
                    key={y}
                    ref={isSelected ? activeYearRef : undefined}
                    type="button"
                    onClick={() =>
                      jumpTo(`${y}-${String(currentMonthIndex + 1).padStart(2, "0")}`)
                    }
                    className={cn(
                      "rounded-md py-1.5 text-center font-mono text-xs transition-colors",
                      isSelected ? "bg-brand font-bold text-on-solid" : "text-ink hover:bg-paper",
                    )}
                  >
                    {y}
                  </button>
                );
              })}
              {filteredYears.length === 0 && (
                <p className="col-span-3 py-3 text-center text-xs text-faint">No matching year</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-2 grid grid-cols-7 gap-y-0.5">
        {WEEKDAY_LABELS.map((label, index) => (
          <span
            key={`${label}-${index}`}
            aria-hidden="true"
            className={cn(
              CELL,
              "grid place-items-center text-[10px] font-bold uppercase tracking-[0.06em] text-faint",
            )}
          >
            {label}
          </span>
        ))}
      </div>

      <div
        ref={gridRef}
        role="grid"
        aria-label={`${monthLabel(month)}. Use the arrow keys to move by day, Page Up and Page Down by month.`}
        onKeyDown={onGridKeyDown}
      >
        <motion.div
          key={month}
          role="rowgroup"
          initial={reduceMotion ? false : { opacity: 0.5, filter: "blur(2px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.16, ease: EASE }}
        >
          {weeks.map((week) => (
            <div key={week[0].iso} role="row" className="grid grid-cols-7 gap-y-0.5">
              {week.map((cell) => {
                const flags = dayFlags(cell.iso, { selection: value, hover, min, max, today });

                // The track sits behind the day: full width inside the span,
                // half width under each end, so consecutive cells join into one
                // bar while the caps keep their own pill. A preview is lighter.
                const track = flags.isPreview ? "bg-brand/[0.10]" : "bg-brand/[0.16]";
                const isCap = flags.isStart || flags.isEnd;
                const oneDay = flags.isStart && flags.isEnd;

                return (
                  <div
                    key={cell.iso}
                    role="gridcell"
                    aria-selected={isCap}
                    className="relative"
                  >
                    {flags.isInside && (
                      <span aria-hidden="true" className={cn("absolute inset-0", track)} />
                    )}
                    {flags.isStart && !oneDay && (
                      <span
                        aria-hidden="true"
                        className={cn("absolute inset-y-0 right-0 w-1/2", track)}
                      />
                    )}
                    {flags.isEnd && !oneDay && (
                      <span
                        aria-hidden="true"
                        className={cn("absolute inset-y-0 left-0 w-1/2", track)}
                      />
                    )}

                    <button
                      type="button"
                      data-day={cell.iso}
                      tabIndex={cell.iso === focusedDay ? 0 : -1}
                      disabled={flags.isDisabled}
                      aria-current={flags.isToday ? "date" : undefined}
                      aria-label={formatDayLong(cell.iso)}
                      onMouseEnter={() => setHover(cell.iso)}
                      onFocus={() => setHover(cell.iso)}
                      onClick={() => selectDay(cell.iso)}
                      className={cn(
                        CELL,
                        "relative z-10 grid place-items-center rounded-lg text-[12px] tabular-nums transition-colors",
                        "focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-brand",
                        flags.isDisabled ? "cursor-not-allowed text-faint" : "hover:bg-paper",
                        isCap
                          ? "bg-brand font-bold text-on-solid hover:bg-brand"
                          : cell.inMonth
                            ? "font-medium text-ink"
                            : "font-medium text-faint",
                        flags.isToday && !isCap && "ring-1 ring-inset ring-brand/45",
                      )}
                    >
                      {cell.dayOfMonth}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </motion.div>
      </div>

      <p className="mt-2 text-center text-[11px] font-medium text-faint" aria-live="polite">
        {readout}
      </p>

      {presets.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1 pt-2">
          {presets.map((preset) => {
            const isActive = value.from === preset.from && value.to === preset.to;
            return (
              <button
                key={preset.label}
                type="button"
                aria-pressed={isActive}
                onClick={() => {
                  onChange({ from: preset.from, to: preset.to });
                  setMonth(monthKeyOf(preset.from));
                  setFocusedDay(preset.from);
                }}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand",
                  isActive
                    ? "bg-brand/15 text-ink"
                    : "bg-paper text-dim hover:bg-paper-sunk hover:text-ink",
                )}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default DateRangeCalendar;
