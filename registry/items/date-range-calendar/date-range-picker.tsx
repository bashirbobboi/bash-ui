"use client";

import { useState } from "react";
import { CalendarRange, Check, ChevronDown } from "lucide-react";
import { AnimatePresence, motion, useReducedMotionConfig } from "motion/react";

import { cn } from "@/lib/utils";
import {
  DateRangeCalendar,
  isCompleteRange,
  keepInViewport,
  type CalendarPreset,
  type RangeSelection,
} from "./date-range-calendar";

/**
 * A period dropdown: a short list of presets ("Past 30 days") with an optional
 * "Custom range" step that widens the same popover into a range calendar. A
 * bespoke window never leaves the control the user already learned; the
 * dropdown just grows a second step.
 */

/**
 * A selectable window. Two shapes:
 * - `points`: how many trailing points to keep; omit for "everything" (presets).
 * - `from`/`to`: inclusive ISO days (custom ranges). These win over `points`.
 */
export type PeriodOption = { label: string; points?: number; from?: string; to?: string };

/**
 * The custom-range editor's own width, fixed on purpose. The popover
 * shrink-wraps its content, and the calendar's cells are `w-full`, so "auto"
 * would be circular; pinning the editor gives the width animation a number.
 * 16.5rem puts each day column at ~35px.
 */
const RANGE_EDITOR_WIDTH = "16.5rem";

/* ─── Motion ────────────────────────────────────────────────────────────────
 * Opening and closing are deliberately not symmetrical. EASE is front-loaded:
 * on a press the box is most of the way open in the first third. Run backwards
 * it lurches away and crawls the last 20%, so closing uses its mirror
 * (COLLAPSE_EASE) over a slightly longer duration. The calendar fades in
 * behind the box as it opens, and out ahead of it as it closes.
 */
const EASE = [0.2, 0.7, 0.2, 1] as const;
const COLLAPSE_EASE = [0.8, 0, 0.3, 0.8] as const;
const EXPAND = { duration: 0.42, ease: EASE } as const;
const COLLAPSE = { duration: 0.52, ease: COLLAPSE_EASE } as const;
const FADE_IN = { duration: 0.28, delay: 0.08, ease: EASE } as const;
const FADE_OUT = { duration: 0.3, ease: COLLAPSE_EASE } as const;
const POPOVER_IN = { duration: 0.16, ease: EASE } as const;
const POPOVER_OUT = { duration: 0.26, ease: COLLAPSE_EASE } as const;
const INSTANT = { duration: 0 } as const;

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

/**
 * "12 Aug – 25 Aug", appending the year whenever either end isn't this year.
 * Month names are spelled out here, not by Intl: runtimes disagree on "Sep".
 */
export function formatRangeLabel(from: string, to: string, now: Date = new Date()): string {
  const thisYear = now.getUTCFullYear();
  const label = (iso: string) => {
    const d = new Date(`${iso}T00:00:00Z`);
    const year = d.getUTCFullYear();
    return `${d.getUTCDate()} ${SHORT_MONTHS[d.getUTCMonth()]}${year === thisYear ? "" : ` ${year}`}`;
  };
  return `${label(from)} – ${label(to)}`;
}

function CustomRangeEditor({
  initial,
  canReset,
  min,
  max,
  now,
  presetOptions,
  onApply,
  onReset,
}: {
  initial: { from: string; to: string } | null;
  canReset: boolean;
  min?: string | null;
  max?: string | null;
  now?: Date;
  presetOptions?: CalendarPreset[];
  onApply: (from: string, to: string) => void;
  onReset: () => void;
}) {
  const [selection, setSelection] = useState<RangeSelection>(() => ({
    from: initial?.from ?? null,
    to: initial?.to ?? null,
  }));
  const valid = isCompleteRange(selection);

  return (
    <form
      className="mt-1 space-y-2 rounded-xl bg-paper p-2"
      style={{ width: RANGE_EDITOR_WIDTH }}
      onSubmit={(event) => {
        event.preventDefault();
        if (isCompleteRange(selection)) onApply(selection.from, selection.to);
      }}
    >
      <DateRangeCalendar
        value={selection}
        onChange={setSelection}
        min={min}
        max={max}
        now={now}
        presetOptions={presetOptions}
      />

      <div className="flex items-center gap-1.5">
        <button
          type="submit"
          disabled={!valid}
          className="flex-1 rounded-lg bg-brand px-3 py-1.5 text-[12px] font-bold text-on-solid transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:pointer-events-none disabled:opacity-35"
        >
          Apply range
        </button>
        {canReset && (
          <button
            type="button"
            aria-label="Reset to default period"
            onClick={onReset}
            className="rounded-lg px-3 py-1.5 text-[12px] font-bold text-dim transition-colors hover:bg-paper-sunk hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Reset
          </button>
        )}
      </div>
    </form>
  );
}

export type DateRangePickerProps = {
  /** Label of the selected option; shown on the trigger. */
  value: string;
  options: PeriodOption[];
  onChange: (option: PeriodOption) => void;
  /** Adds a "Custom range" step for picking exact dates on a calendar. */
  allowCustomRange?: boolean;
  /** Where "Reset" sends the selection back to (usually the default preset). */
  defaultOption?: PeriodOption;
  /**
   * Inclusive ISO-day bounds the calendar may select within, normally the first
   * and last day the data holds. Without them a user can pick a window the data
   * does not cover and get an empty chart, which reads as broken.
   */
  rangeMin?: string | null;
  rangeMax?: string | null;
  /** Shortcuts under the calendar. Defaults to This month / Last month / This quarter. */
  calendarPresets?: CalendarPreset[];
  /** Fixes "today" for the calendar and the label's year; defaults to the clock. */
  now?: Date;
  className?: string;
};

export function DateRangePicker({
  value,
  options,
  onChange,
  allowCustomRange = false,
  defaultOption,
  rangeMin,
  rangeMax,
  calendarPresets,
  now,
  className,
}: DateRangePickerProps) {
  const reduceMotion = useReducedMotionConfig();
  const [open, setOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [appliedCustom, setAppliedCustom] = useState<{
    label: string;
    from: string;
    to: string;
  } | null>(null);
  const isCustomSelected = appliedCustom !== null && value === appliedCustom.label;

  const optionClass = (selected: boolean) =>
    cn(
      "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-[13px] font-medium transition-colors",
      selected ? "bg-paper text-ink" : "text-dim hover:bg-paper hover:text-ink",
    );

  return (
    // Below `sm` the wrapper takes the full row width, so the right-anchored
    // panel drops from the row's right edge instead of spilling off-screen
    // from a trigger that wrapped to the left.
    <div
      className={cn("relative font-body max-sm:w-full", open && "z-50", className)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false);
      }}
    >
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((previous) => !previous)}
        className="flex items-center gap-1.5 rounded-full bg-paper px-2.5 py-1 text-[13px] font-medium text-dim transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand max-sm:inline-flex"
      >
        <span>{value}</span>
        <motion.span
          className="block"
          animate={{ rotate: open ? 180 : 0 }}
          transition={reduceMotion ? INSTANT : { duration: 0.2 }}
        >
          <ChevronDown size={14} strokeWidth={2.5} />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={
              reduceMotion
                ? { opacity: 0, transition: { duration: 0.1 } }
                : { opacity: 0, scale: 0.95, y: -4, transition: POPOVER_OUT }
            }
            transition={POPOVER_IN}
            /*
             * `w-max` is what lets the widening animate: the popover's width is
             * whatever its widest child measures, so it follows the editor's own
             * animated width frame by frame. It grows leftwards from `right-0`;
             * the max-width and keepInViewport keep it on a narrow phone.
             */
            ref={keepInViewport}
            className="absolute right-0 top-full z-50 mt-1.5 w-max min-w-[10.5rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-rule bg-popover/95 p-1.5 shadow-[0_10px_30px_color-mix(in_oklab,var(--ink)_15%,transparent)] backdrop-blur-md"
          >
            {options.map((option) => {
              const isSelected = option.label === value;
              return (
                <li key={option.label}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(option);
                      setCustomOpen(false);
                      setOpen(false);
                    }}
                    className={optionClass(isSelected)}
                  >
                    <span>{option.label}</span>
                    {isSelected && (
                      <motion.span
                        initial={reduceMotion ? false : { scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                      >
                        <Check size={14} strokeWidth={3} />
                      </motion.span>
                    )}
                  </button>
                </li>
              );
            })}

            {allowCustomRange && (
              <>
                <li aria-hidden="true" className="mx-2 my-1 border-t border-rule" />
                <li>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isCustomSelected}
                    onClick={() => setCustomOpen((previous) => !previous)}
                    className={optionClass(isCustomSelected)}
                  >
                    <span>{appliedCustom?.label ?? "Custom range"}</span>
                    <motion.span
                      initial={false}
                      animate={{ rotate: customOpen ? 90 : 0 }}
                      transition={reduceMotion ? INSTANT : { duration: 0.2 }}
                      className="shrink-0"
                    >
                      {isCustomSelected ? (
                        <Check size={14} strokeWidth={3} />
                      ) : (
                        <CalendarRange size={14} strokeWidth={2.5} />
                      )}
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {customOpen && (
                      <motion.div
                        /*
                         * Width AND height on the one curve: growing the
                         * editor's own width from 0 makes the shrink-wrapped
                         * popover widen with it, so the box opens as a single
                         * motion. The opening fade delay must not apply on
                         * exit, or the calendar would still show while the box
                         * narrows past it.
                         */
                        initial={{ opacity: 0, width: 0, height: 0 }}
                        animate={{ opacity: 1, width: RANGE_EDITOR_WIDTH, height: "auto" }}
                        exit={{
                          opacity: 0,
                          width: 0,
                          height: 0,
                          transition: reduceMotion
                            ? INSTANT
                            : { width: COLLAPSE, height: COLLAPSE, opacity: FADE_OUT },
                        }}
                        transition={
                          reduceMotion
                            ? INSTANT
                            : { width: EXPAND, height: EXPAND, opacity: FADE_IN }
                        }
                        className="overflow-hidden"
                      >
                        <CustomRangeEditor
                          initial={appliedCustom}
                          canReset={isCustomSelected}
                          min={rangeMin}
                          max={rangeMax}
                          now={now}
                          presetOptions={calendarPresets}
                          onReset={() => {
                            setAppliedCustom(null);
                            setCustomOpen(false);
                            setOpen(false);
                            if (defaultOption) onChange(defaultOption);
                          }}
                          onApply={(from, to) => {
                            const label = formatRangeLabel(from, to, now);
                            setAppliedCustom({ label, from, to });
                            onChange({ label, from, to });
                            setCustomOpen(false);
                            setOpen(false);
                          }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              </>
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

export default DateRangePicker;
