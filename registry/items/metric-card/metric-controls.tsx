"use client";

import { useState } from "react";
import { Activity, BarChart3, CalendarRange, Check, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { cn } from "@/lib/utils";
import {
  DateRangeCalendar,
  isCompleteRange,
  keepInViewport,
  type RangeSelection,
} from "../date-range-calendar/date-range-calendar";
import { EASE, SHORT_MONTHS, type ChartView } from "./metric-chart";

/**
 * A selectable window over the series. Two shapes:
 * - `points`: how many trailing points to keep; omit for "everything".
 * - `from`/`to`: inclusive ISO days (YYYY-MM-DD). When present they win over `points`.
 */
export type PeriodOption = { label: string; points?: number; from?: string; to?: string };

/**
 * The custom-range editor's own width, fixed on purpose: the popover shrink-wraps
 * its content, and animating `width: 0 → auto` needs a stable target.
 */
const RANGE_EDITOR_WIDTH = "16.5rem";

/* Popover motion. Opening uses EASE (front-loaded, answers the press at once);
 * closing uses its mirror, COLLAPSE_EASE, and runs a little longer, so the box
 * leaves gently instead of lurching away and crawling. */
const EXPAND = { duration: 0.42, ease: EASE } as const;
const COLLAPSE_EASE = [0.8, 0, 0.3, 0.8] as const;
const COLLAPSE = { duration: 0.52, ease: COLLAPSE_EASE } as const;
/** The calendar fades in behind the box, and out ahead of it. */
const FADE_IN = { duration: 0.28, delay: 0.08 } as const;
const FADE_OUT = { duration: 0.3 } as const;
const POPOVER_IN = { duration: 0.16, ease: EASE } as const;
const POPOVER_OUT = { duration: 0.26, ease: COLLAPSE_EASE } as const;

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

/** "12 Aug – 25 Aug", appending the year whenever either end isn't this year. */
function formatRangeLabel(from: string, to: string): string {
  const currentYear = new Date().getUTCFullYear();
  const part = (iso: string) => {
    const d = new Date(`${iso}T00:00:00Z`);
    const label = `${d.getUTCDate()} ${SHORT_MONTHS[d.getUTCMonth()]}`;
    return d.getUTCFullYear() === currentYear ? label : `${label} ${d.getUTCFullYear()}`;
  };
  return `${part(from)} – ${part(to)}`;
}

function CustomRangeEditor({
  initial,
  canReset,
  min,
  max,
  onApply,
  onReset,
}: {
  initial: { from: string; to: string } | null;
  canReset: boolean;
  min?: string | null;
  max?: string | null;
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
      <DateRangeCalendar value={selection} onChange={setSelection} min={min} max={max} />
      <div className="flex items-center gap-1.5">
        <button
          type="submit"
          disabled={!valid}
          className={cn(
            "flex-1 rounded-lg bg-brand px-3 py-1.5 text-[12px] font-bold text-on-solid transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-35",
            FOCUS,
          )}
        >
          Apply range
        </button>
        {canReset && (
          <button
            type="button"
            aria-label="Reset to default period"
            onClick={onReset}
            className={cn(
              "rounded-lg px-3 py-1.5 text-[12px] font-bold text-muted-foreground transition-colors hover:bg-paper-sunk hover:text-foreground",
              FOCUS,
            )}
          >
            Reset
          </button>
        )}
      </div>
    </form>
  );
}

/*
 * Both controls sit inside the card's `pointer-events-none` content layer
 * (which lets the chart underneath take the hover), so each interactive
 * element opts back in with `pointer-events-auto`.
 */

export function ViewToggle({
  value,
  onChange,
  layoutId = "view-toggle-pill",
}: {
  value: ChartView;
  onChange: (view: ChartView) => void;
  /** The moving pill's shared-layout id. Give each card on a page its own. */
  layoutId?: string;
}) {
  const item = (view: ChartView, Icon: typeof Activity, label: string) => {
    const isSelected = value === view;
    return (
      <button
        type="button"
        aria-label={label}
        aria-pressed={isSelected}
        onClick={() => onChange(view)}
        className={cn(
          "pointer-events-auto relative z-10 rounded-full p-1.5 transition-colors",
          FOCUS,
          isSelected ? "font-semibold text-foreground" : "text-faint hover:text-ink",
        )}
      >
        {isSelected && (
          <motion.div
            layoutId={layoutId}
            className="absolute inset-0 rounded-full bg-card shadow-sm"
            transition={{ type: "spring", stiffness: 450, damping: 30 }}
          />
        )}
        <span className="relative z-10 block">
          <Icon size={14} strokeWidth={2.5} />
        </span>
      </button>
    );
  };

  return (
    <div className="flex items-center gap-0.5 rounded-full bg-paper p-0.5 backdrop-blur-sm">
      {item("curve", Activity, "Line view")}
      {item("bars", BarChart3, "Bar view")}
    </div>
  );
}

export function PeriodSelect({
  value,
  options,
  onChange,
  accentText,
  allowCustomRange = false,
  defaultOption,
  rangeMin,
  rangeMax,
}: {
  value: string;
  options: PeriodOption[];
  onChange: (option: PeriodOption) => void;
  accentText: string;
  allowCustomRange?: boolean;
  /** Where "Reset" sends the selection back to. */
  defaultOption?: PeriodOption;
  /** Inclusive ISO-day bounds the calendar may select within. */
  rangeMin?: string | null;
  rangeMax?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [appliedCustom, setAppliedCustom] = useState<{ label: string; from: string; to: string } | null>(null);
  const isCustomSelected = appliedCustom !== null && value === appliedCustom.label;

  const optionClass = (selected: boolean) =>
    cn(
      "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-[13px] font-medium transition-colors",
      selected ? "bg-paper" : "hover:bg-paper",
    );

  return (
    // Below `sm` the wrapper takes the full row, so the right-anchored panel
    // drops from the row's right edge instead of spilling off-screen.
    <div
      className={cn("relative max-sm:w-full", open && "z-50")}
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
        className={cn(
          "pointer-events-auto flex items-center gap-1.5 rounded-full bg-paper px-2.5 py-1 text-[13px] font-medium text-muted-foreground transition-all hover:text-foreground max-sm:inline-flex",
          FOCUS,
        )}
      >
        <span>{value}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} strokeWidth={2.5} />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4, transition: POPOVER_OUT }}
            transition={POPOVER_IN}
            // `w-max` lets the popover follow the editor's animated width frame
            // by frame; the max-width keeps it on a narrow phone.
            ref={keepInViewport}
            className="pointer-events-auto absolute right-0 top-full z-50 mt-1.5 w-max min-w-[10.5rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-rule bg-popover/95 p-1.5 shadow-xl backdrop-blur-md"
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
                    style={isSelected ? { color: accentText } : undefined}
                  >
                    <span>{option.label}</span>
                    {isSelected && (
                      <motion.span
                        initial={{ scale: 0 }}
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
                    style={isCustomSelected ? { color: accentText } : undefined}
                  >
                    <span>{appliedCustom?.label ?? "Custom range"}</span>
                    <motion.span
                      initial={false}
                      animate={{ rotate: customOpen ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
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
                        // Width and height on one curve, so the shrink-wrapped
                        // popover widens with the editor as a single motion.
                        initial={{ opacity: 0, width: 0, height: 0 }}
                        animate={{ opacity: 1, width: RANGE_EDITOR_WIDTH, height: "auto" }}
                        exit={{
                          opacity: 0,
                          width: 0,
                          height: 0,
                          transition: {
                            width: COLLAPSE,
                            height: COLLAPSE,
                            opacity: { ...FADE_OUT, ease: COLLAPSE_EASE },
                          },
                        }}
                        transition={{ width: EXPAND, height: EXPAND, opacity: { ...FADE_IN, ease: EASE } }}
                        className="overflow-hidden"
                      >
                        <CustomRangeEditor
                          initial={appliedCustom}
                          canReset={isCustomSelected}
                          min={rangeMin}
                          max={rangeMax}
                          onReset={() => {
                            setAppliedCustom(null);
                            setCustomOpen(false);
                            setOpen(false);
                            if (defaultOption) onChange(defaultOption);
                          }}
                          onApply={(from, to) => {
                            const label = formatRangeLabel(from, to);
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
