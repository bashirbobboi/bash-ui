"use client";

import {
  AnimatePresence,
  motion,
  useReducedMotionConfig,
  type Transition,
  type Variants,
} from "motion/react";
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Check, ChevronLeft, SlidersHorizontal, X } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * A pill that unfolds into a filter panel. Collapsed it is one row: a prompt
 * with a cycling subject, a submit disc that appears once there is something to
 * search, and a filters toggle. Open, that row stays exactly where it was and a
 * panel grows underneath it, so opening reads as the pill extending rather than
 * a card arriving.
 *
 * Searching is explicit. Typing and picking filters only stage them; nothing is
 * reported until Enter or the disc is pressed, and then `onSubmit` receives the
 * query and every staged filter at once. The disc wears a rolling square for at
 * least `minSpinMs` (and for as long as a returned promise is pending), because
 * a search that resolves in zero frames reads as broken.
 *
 * The bar sits in a fixed-height frame and the open card floats over whatever
 * is below it, so the page never jumps when the panel opens.
 */

/** Collapsed row height; also the pill's radius, so the pill and the open
 *  card's corner are the same number and the morph has nothing to interpolate. */
const ROW = 64;

/** Body of the open panel. Fixed, so swapping views inside it never resizes it. */
const PANEL_H = "h-[280px]";

const SUBJECT_HOLD = 2400;

const EASE = [0.2, 0.7, 0.2, 1] as const;

const DEFAULT_SUBJECTS = ["Charities", "Companies", "Grants", "Clients"] as const;

const PANEL_STAGGER: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.14 } },
};

/**
 * Rows inside the card rise on opacity and y only, never `filter`: a filter on
 * a descendant of a `backdrop-filter` element breaks the parent's backdrop
 * sampling in Chrome and Safari, and the frost goes flat.
 */
const ITEM: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE } },
};

const OPTION: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: (index: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: EASE, delay: Math.min(index * 0.025, 0.3) },
  }),
};

const NO_SCROLLBAR = "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]";

/** A 44px hit area on touch screens around a control that stays visually small. */
const TOUCH =
  "pointer-coarse:relative pointer-coarse:after:absolute pointer-coarse:after:top-1/2 pointer-coarse:after:left-1/2 pointer-coarse:after:size-11 pointer-coarse:after:-translate-x-1/2 pointer-coarse:after:-translate-y-1/2 pointer-coarse:after:content-['']";

/**
 * Accents. Lead on a light page; lime on a dark one, where the disc, the
 * spinner, checks and focus rings become the brand moment.
 */
const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lead dark:focus-visible:outline-lime";
const FIELD_FOCUS = "focus-visible:ring-2 focus-visible:ring-go dark:focus-visible:ring-lime";
const DISC =
  "bg-lead text-on-solid hover:bg-lead-mid dark:bg-lime dark:text-on-lime dark:hover:bg-lime-hover";
const SPINNER =
  "bg-lead shadow-[0_0_10px_var(--lead)] dark:bg-lime dark:shadow-[0_0_10px_var(--lime)]";
const ACCENT_TEXT = "text-go dark:text-lime";
const SELECTED = "bg-lime/40 text-go dark:bg-on-solid/15 dark:text-lime";
const SELECTED_BTN =
  "bg-lime/40 text-go ring-1 ring-go/40 dark:bg-on-solid/20 dark:text-lime dark:ring-lime/50";
const TOGGLE = "bg-ink/8 text-ink hover:bg-ink/12";
const ROW_HOVER = "hover:bg-ink/5 hover:text-ink";

export type FilterOption = {
  label: string;
  value: string;
  /** Optional swatch colour (any CSS colour, ideally a token: `var(--go)`). */
  colour?: string;
};

export type FilterCategory = {
  /** Shown as the category row and used as the chip's category. */
  label: string;
  /** What can be picked. Ignored when `freeText` is set. */
  options?: FilterOption[];
  /**
   * Make this a typed filter: the panel shows a text field instead of a list.
   * At most one value is staged per free-text category.
   */
  freeText?: {
    placeholder?: string;
    hint?: ReactNode;
    maxLength?: number;
    /** Button label before a value is staged. */
    addLabel?: string;
    /** Button label once one is. */
    updateLabel?: string;
  };
};

export type ActiveFilter = FilterOption & { category: string };

export type SearchBarAsk = {
  /** Row label, e.g. "Ask in plain English". */
  label: string;
  placeholder?: string;
  defaultValue?: string;
  maxLength?: number;
  /** Runs on Enter or the ask disc. Return a promise to keep the spinner up
   *  until it settles; the panel closes when it does. */
  onAsk: (question: string) => void | Promise<unknown>;
  /** The host's own work for the question is running. */
  pending?: boolean;
};

export type SearchBarProps = {
  className?: string;
  /** Controlled query text. */
  value?: string;
  /** Uncontrolled starting query. */
  defaultValue?: string;
  /** Every keystroke. Nothing is searched until submit. */
  onValueChange?: (value: string) => void;
  /** The static half of the prompt. */
  placeholder?: string;
  /** Words that cycle after the prompt while the field is empty. Name what this page holds. */
  subjects?: readonly string[];
  /** Filter groups. Omit and the filters toggle is not rendered. */
  categories?: FilterCategory[];
  /** Controlled staged filters. */
  filters?: ActiveFilter[];
  /** Uncontrolled starting filters, so a filtered page renders its own chips. */
  defaultFilters?: ActiveFilter[];
  /** Staged filters changed (picked, removed). Nothing is searched until submit. */
  onFiltersChange?: (filters: ActiveFilter[]) => void;
  /**
   * Enter, the disc, or "Clear filters" (with an empty query and no filters).
   * Return a promise to keep the spinner up until it settles.
   */
  onSubmit?: (query: string, filters: ActiveFilter[]) => void | Promise<unknown>;
  /** The host's own work is running; the disc shows the rolling square. */
  pending?: boolean;
  /** Shortest the rolling square plays after a submit. */
  minSpinMs?: number;
  /** A second, descriptive field at the top of the filter panel. */
  ask?: SearchBarAsk;
  /** Show staged filters as removable chips under the pill. */
  chipsBelow?: boolean;
  /** Accessible label for the query field. Defaults to the placeholder. */
  "aria-label"?: string;
};

function rankOption(label: string, query: string): number {
  const l = label.toLowerCase();
  if (l.startsWith(query)) return 0;
  if (l.includes(` ${query}`)) return 1;
  return l.includes(query) ? 2 : -1;
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className={cn("block h-4.5 w-4.5 animate-spin rounded-[4px]", SPINNER)}
      style={{ animationDuration: "2.5s" }}
    />
  );
}

export function SearchBar({
  className,
  value,
  defaultValue = "",
  onValueChange,
  placeholder = "I want to learn about",
  subjects = DEFAULT_SUBJECTS,
  categories,
  filters: filtersProp,
  defaultFilters = [],
  onFiltersChange,
  onSubmit,
  pending = false,
  minSpinMs = 1500,
  ask,
  chipsBelow = true,
  "aria-label": ariaLabel,
}: SearchBarProps) {
  const reduced = useReducedMotionConfig() ?? false;
  const t = (transition: Transition): Transition => (reduced ? { duration: 0 } : transition);

  const [innerQuery, setInnerQuery] = useState(defaultValue);
  const query = value ?? innerQuery;
  const setQuery = (next: string) => {
    if (value === undefined) setInnerQuery(next);
    onValueChange?.(next);
  };

  const [innerFilters, setInnerFilters] = useState<ActiveFilter[]>(defaultFilters);
  const filters = filtersProp ?? innerFilters;
  const setFilters = (next: ActiveFilter[]) => {
    if (filtersProp === undefined) setInnerFilters(next);
    onFiltersChange?.(next);
  };

  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [optionQuery, setOptionQuery] = useState("");
  const [freeTextValue, setFreeTextValue] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [askValue, setAskValue] = useState(ask?.defaultValue ?? "");
  const [askRunning, setAskRunning] = useState(false);
  const askPending = askRunning || Boolean(ask?.pending);
  const busy = spinning || pending;

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelBodyRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const askId = useId();

  const hasFilters = Boolean(categories && categories.length > 0);
  const typing = query.length > 0;

  /**
   * The card animates to a measured pixel height rather than "auto": swapping
   * views inside an open panel changes nothing Motion can see when the target
   * stays the string "auto", so the box would snap instead of tween.
   */
  const [panelBodyHeight, setPanelBodyHeight] = useState<number | null>(null);
  useEffect(() => {
    const body = panelBodyRef.current;
    if (!open || !body) return;
    const observer = new ResizeObserver(([entry]) => setPanelBodyHeight(entry.contentRect.height));
    observer.observe(body);
    return () => observer.disconnect();
  }, [open]);

  // The subject cycles only while there is nothing else in the row to read.
  useEffect(() => {
    if (typing || open || reduced || subjects.length < 2) return;
    const id = setInterval(() => setSubject((i) => (i + 1) % subjects.length), SUBJECT_HOLD);
    return () => clearInterval(id);
  }, [open, typing, reduced, subjects.length]);

  // Pointerdown, not click: a drag that starts inside and ends outside must not
  // close the panel out from under the cursor.
  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const close = () => {
    setOpen(false);
    setTimeout(() => {
      setActiveCategory(null);
      setOptionQuery("");
    }, 300);
  };

  const submit = (nextFilters = filters, q = query, closePanel = true) => {
    if (busy) return;
    if (closePanel) close();
    inputRef.current?.blur();
    setSpinning(true);
    const started = Date.now();
    const done = () => {
      const rest = reduced ? 0 : Math.max(0, minSpinMs - (Date.now() - started));
      setTimeout(() => setSpinning(false), rest);
    };
    Promise.resolve(onSubmit?.(q, nextFilters)).then(done, (error: unknown) => {
      done();
      throw error;
    });
  };

  const submitAsk = () => {
    const question = askValue.trim();
    if (!ask || !question || askPending) return;
    setAskRunning(true);
    Promise.resolve(ask.onAsk(question)).then(
      () => {
        setAskRunning(false);
        close();
      },
      (error: unknown) => {
        setAskRunning(false);
        throw error;
      },
    );
  };

  /** Empties the chips and the query, then submits: clearing is an explicit
   *  act, so the host is told, rather than left filtering by invisible chips. */
  const clearAll = () => {
    setFilters([]);
    setQuery("");
    submit([], "", false);
  };

  const removeFilter = (category: string, optionValue: string) =>
    setFilters(filters.filter((f) => !(f.category === category && f.value === optionValue)));

  const toggleOption = (category: string, option: FilterOption) => {
    const selected = filters.some((f) => f.category === category && f.value === option.value);
    setFilters(
      selected
        ? filters.filter((f) => !(f.category === category && f.value === option.value))
        : [...filters, { category, ...option }],
    );
  };

  const stageFreeText = (category: string): ActiveFilter[] => {
    const trimmed = freeTextValue.trim();
    const staged = [
      ...filters.filter((f) => f.category !== category),
      ...(trimmed ? [{ category, label: trimmed, value: trimmed }] : []),
    ];
    setFilters(staged);
    setFreeTextValue("");
    return staged;
  };

  const active = categories?.find((c) => c.label === activeCategory);
  const trimmedOptionQuery = optionQuery.trim();

  const activeOptions = useMemo(() => {
    const all = active?.options ?? [];
    const q = trimmedOptionQuery.toLowerCase();
    if (!q) return all;
    // The source index breaks ties, so equally ranked options keep the host's order.
    return all
      .map((option, index) => ({ option, index, rank: rankOption(option.label, q) }))
      .filter((entry) => entry.rank >= 0)
      .sort((a, b) => a.rank - b.rank || a.index - b.index)
      .map((entry) => entry.option);
  }, [active, trimmedOptionQuery]);

  const longestSubject = subjects.reduce((a, b) => (b.length > a.length ? b : a), "");

  const backButton = (
    <button
      type="button"
      onClick={() => {
        setActiveCategory(null);
        setOptionQuery("");
      }}
      className={cn(
        "font-body flex shrink-0 items-center gap-1 rounded-panel px-3 py-2 text-[15px] font-medium text-dim transition-colors",
        ROW_HOVER,
        FOCUS,
      )}
    >
      <ChevronLeft className="h-4 w-4" />
      Back
    </button>
  );

  const chip = (filter: ActiveFilter) => (
    <motion.span
      key={`${filter.category}-${filter.value}`}
      initial={{ opacity: 0, scale: 0.8, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -10 }}
      transition={t({ duration: 0.2, ease: EASE })}
      layout={!reduced}
      className="font-body flex max-w-full min-w-0 items-center gap-1.5 rounded-full bg-ground px-3 py-1.5 text-[14px] font-medium text-ink shadow-sm"
    >
      {filter.colour && (
        <span
          aria-hidden="true"
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: filter.colour }}
        />
      )}
      <span className="min-w-0 truncate">{filter.label}</span>
      <button
        type="button"
        aria-label={`Remove ${filter.label} filter`}
        onClick={() => removeFilter(filter.category, filter.value)}
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-paper text-dim transition-colors hover:bg-paper-sunk",
          TOUCH,
          FOCUS,
        )}
      >
        <X className="h-3 w-3" />
      </button>
    </motion.span>
  );

  return (
    <div className={cn("flex w-full max-w-[600px] flex-col gap-3", className)}>
      <div className="relative z-50 w-full" style={{ height: ROW }}>
        <div
          ref={rootRef}
          className="absolute inset-x-0 top-0 flex flex-col"
          onKeyDown={(event) => {
            if (event.key === "Escape" && open) {
              event.stopPropagation();
              close();
              inputRef.current?.blur();
            }
          }}
        >
          <motion.div
            className="relative w-full overflow-hidden bg-lead-wash shadow-[inset_0_1px_0_color-mix(in_oklab,var(--card)_30%,transparent)]"
            style={{ borderRadius: ROW / 2 }}
            initial={false}
            animate={{ height: open ? (panelBodyHeight != null ? ROW + panelBodyHeight : "auto") : ROW }}
            transition={t({ duration: 0.7, ease: EASE })}
          >
            {/* The frost lives on a childless layer: `backdrop-filter` is defeated
                by any `filter` in its own subtree, and a leaf has none. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] backdrop-blur-[3px]"
            />
            {/* Open, the card steps from the closed wash to a floating surface.
                An opacity crossfade rather than a colour tween, so it follows
                the theme and the mode without re-resolving anything. */}
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-0 bg-popover"
              initial={false}
              animate={{ opacity: open ? 1 : 0 }}
              transition={t({ duration: 0.7, ease: EASE })}
            />
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-0 bg-on-solid/8"
              initial={false}
              animate={{ opacity: open ? 1 : 0 }}
              transition={t({ duration: 0.3, ease: EASE })}
            />

            {/* The prompt row. */}
            <div
              className="relative z-20 flex items-center bg-lead-wash pr-2 pl-4 sm:pr-3 sm:pl-7"
              style={{ height: ROW, borderRadius: ROW / 2 }}
            >
              <div className="relative mr-2 min-w-0 flex-1 overflow-hidden sm:mr-3">
                <input
                  ref={inputRef}
                  type="search"
                  value={query}
                  aria-label={ariaLabel ?? `${placeholder}…`}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      event.stopPropagation();
                      submit();
                    }
                  }}
                  className="font-body w-full bg-transparent text-[15px] text-ink caret-lead outline-none focus-visible:outline-none sm:text-base dark:caret-lime [&::-webkit-search-cancel-button]:hidden"
                />

                {/* Over the empty field rather than in `placeholder`, which can
                    carry one colour and cannot animate. Click-through. */}
                {!typing && (
                  <div
                    aria-hidden="true"
                    className="font-body pointer-events-none absolute inset-0 flex items-center gap-[0.4ch] text-[15px] whitespace-nowrap sm:text-base"
                  >
                    <span className="min-w-0 truncate text-dim">{placeholder}</span>
                    {subjects.length > 0 && (
                      <span className="relative hidden sm:inline">
                        {/* Reserves the widest subject so the row never jumps. */}
                        <span className="invisible">{longestSubject}</span>
                        <AnimatePresence initial={false} mode="popLayout">
                          <motion.span
                            key={subjects[subject % subjects.length]}
                            className="absolute inset-0 text-ink"
                            initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
                            transition={t({ duration: 0.45, ease: EASE })}
                          >
                            {subjects[subject % subjects.length]}
                          </motion.span>
                        </AnimatePresence>
                      </span>
                    )}
                  </div>
                )}
              </div>

              <AnimatePresence>
                {(typing || filters.length > 0 || busy) && (
                  <motion.div
                    initial={{ width: 0, opacity: 0, scale: 0.8 }}
                    animate={{ width: 30, opacity: 1, scale: 1 }}
                    exit={{ width: 0, opacity: 0, scale: 0.8 }}
                    transition={t({ duration: 0.2, ease: EASE })}
                    className="shrink-0 overflow-visible"
                  >
                    <button
                      type="button"
                      aria-label={busy ? "Searching…" : "Search"}
                      title={busy ? "Searching…" : "Press Enter or click to search"}
                      disabled={busy}
                      onClick={() => submit()}
                      className={cn(
                        "grid h-8 w-8 shrink-0 place-items-center rounded-full transition-all",
                        TOUCH,
                        FOCUS,
                        busy ? "bg-transparent" : DISC,
                      )}
                    >
                      {busy ? <Spinner /> : <ArrowRight className="h-4 w-4" />}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {hasFilters && (
                <div className="ml-2 flex shrink-0 items-center gap-1 sm:ml-3 sm:gap-2">
                  <button
                    type="button"
                    aria-label={open ? "Close filters" : "Open filters"}
                    aria-expanded={open}
                    aria-controls={open ? panelId : undefined}
                    onClick={() => {
                      if (open) {
                        close();
                        inputRef.current?.blur();
                      } else {
                        setOpen(true);
                      }
                    }}
                    className={cn(
                      "grid h-8 w-8 shrink-0 place-items-center rounded-full transition-colors",
                      TOGGLE,
                      TOUCH,
                      FOCUS,
                    )}
                  >
                    {open ? <X className="h-5 w-5" /> : <SlidersHorizontal className="h-4 w-4" />}
                  </button>
                </div>
              )}
            </div>

            <AnimatePresence initial={false}>
              {open && categories && (
                <motion.div
                  key="panel"
                  id={panelId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: t({ duration: 0.18, ease: EASE }) }}
                  transition={t({ duration: 0.5, ease: EASE, delay: 0.2 })}
                  className="relative z-10"
                >
                  <div ref={panelBodyRef}>
                    <AnimatePresence mode="wait">
                      {!active ? (
                        <motion.ul
                          key="categories"
                          className={cn("flex flex-col gap-1 overflow-y-auto px-4 py-4", PANEL_H, NO_SCROLLBAR)}
                          variants={PANEL_STAGGER}
                          initial="hidden"
                          animate="show"
                          exit={{ opacity: 0, transition: t({ duration: 0.15 }) }}
                        >
                          {ask && (
                            <motion.li key="__ask" variants={ITEM} className="mb-1">
                              <div className="rounded-panel bg-ink/5 px-3 py-2">
                                <label
                                  htmlFor={askId}
                                  className="font-body block text-[13px] font-medium text-dim"
                                >
                                  {ask.label}
                                </label>
                                <div className="mt-1.5 flex items-center gap-2">
                                  <input
                                    id={askId}
                                    type="text"
                                    value={askValue}
                                    maxLength={ask.maxLength}
                                    placeholder={ask.placeholder}
                                    onChange={(event) => setAskValue(event.target.value)}
                                    onKeyDown={(event) => {
                                      if (event.key === "Enter") {
                                        event.preventDefault();
                                        event.stopPropagation();
                                        submitAsk();
                                      }
                                    }}
                                    className="font-body min-w-0 flex-1 bg-transparent text-base text-ink caret-lead outline-none placeholder:text-faint dark:caret-lime"
                                  />
                                  <button
                                    type="button"
                                    aria-label={askPending ? "Searching…" : ask.label}
                                    aria-busy={askPending}
                                    disabled={askValue.trim().length === 0 || askPending}
                                    onClick={submitAsk}
                                    className={cn(
                                      "grid h-8 w-8 shrink-0 place-items-center rounded-full transition-all",
                                      TOUCH,
                                      FOCUS,
                                      askPending
                                        ? "bg-transparent"
                                        : cn(DISC, "disabled:cursor-not-allowed disabled:opacity-40"),
                                    )}
                                  >
                                    {askPending ? <Spinner /> : <ArrowRight className="h-4 w-4" />}
                                  </button>
                                </div>
                              </div>
                            </motion.li>
                          )}

                          {categories.map((category) => {
                            const count = filters.filter((f) => f.category === category.label).length;
                            return (
                              <motion.li key={category.label} variants={ITEM}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveCategory(category.label);
                                    setOptionQuery("");
                                    // A typed filter pre-fills from its staged chip,
                                    // so reopening edits the term instead of losing it.
                                    setFreeTextValue(
                                      filters.find((f) => f.category === category.label)?.value ?? "",
                                    );
                                  }}
                                  className={cn(
                                    "font-body flex w-full items-center justify-between rounded-panel px-3 py-2 text-left text-lg font-medium text-ink transition-colors",
                                    ROW_HOVER,
                                    FOCUS,
                                  )}
                                >
                                  <span>{category.label}</span>
                                  {count > 0 && (
                                    <span className="rounded-full bg-lime px-2 py-0.5 text-xs font-bold text-on-lime">
                                      {count}
                                    </span>
                                  )}
                                </button>
                              </motion.li>
                            );
                          })}
                        </motion.ul>
                      ) : active.freeText ? (
                        <motion.div
                          key={`free-${active.label}`}
                          className={cn("flex flex-col px-4 py-4", PANEL_H)}
                          variants={PANEL_STAGGER}
                          initial="hidden"
                          animate="show"
                          exit={{ opacity: 0, transition: t({ duration: 0.15 }) }}
                        >
                          <motion.div variants={ITEM} className="mb-4 flex shrink-0 items-center gap-2">
                            {backButton}
                          </motion.div>
                          <motion.div variants={ITEM} className="flex flex-1 flex-col gap-3">
                            <input
                              type="text"
                              aria-label={active.label}
                              value={freeTextValue}
                              placeholder={active.freeText.placeholder}
                              maxLength={active.freeText.maxLength}
                              onChange={(event) => setFreeTextValue(event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  // Submit what was just staged, not this render's
                                  // pre-stage filters.
                                  event.preventDefault();
                                  event.stopPropagation();
                                  submit(stageFreeText(active.label));
                                }
                              }}
                              className={cn(
                                "font-body w-full rounded-panel bg-ink/5 px-4 py-2.5 text-[15px] text-ink outline-none placeholder:text-faint",
                                FIELD_FOCUS,
                              )}
                            />
                            {active.freeText.hint && (
                              <p className="font-body text-[13px] leading-[1.6] text-dim">{active.freeText.hint}</p>
                            )}
                            <div className="mt-auto flex items-center justify-end gap-2">
                              {(() => {
                                const staged = filters.some((f) => f.category === active.label);
                                return (
                                  <button
                                    type="button"
                                    disabled={!freeTextValue.trim()}
                                    onClick={() => submit(stageFreeText(active.label))}
                                    className={cn(
                                      "font-body inline-flex items-center gap-1.5 rounded-panel px-4 py-2 text-[13px] font-bold shadow-xs transition-all disabled:cursor-not-allowed disabled:opacity-40",
                                      FOCUS,
                                      staged ? SELECTED_BTN : "bg-lime text-on-lime hover:bg-lime-hover",
                                    )}
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                    <span>
                                      {staged
                                        ? (active.freeText.updateLabel ?? "Update filter")
                                        : (active.freeText.addLabel ?? "Add filter")}
                                    </span>
                                  </button>
                                );
                              })()}
                            </div>
                          </motion.div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key={`options-${active.label}`}
                          className={cn("flex flex-col pt-4", PANEL_H)}
                          variants={PANEL_STAGGER}
                          initial="hidden"
                          animate="show"
                          exit={{ opacity: 0, transition: t({ duration: 0.15 }) }}
                        >
                          <motion.div variants={ITEM} className="mb-4 flex shrink-0 items-center gap-2 px-4">
                            {backButton}
                            <input
                              type="search"
                              aria-label={`Search ${active.label.toLowerCase()}`}
                              placeholder={`Search ${active.label.replace(/^filter by /i, "").toLowerCase()}…`}
                              value={optionQuery}
                              onChange={(event) => setOptionQuery(event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  submit();
                                }
                              }}
                              className={cn(
                                "font-body min-w-0 flex-1 rounded-panel bg-ink/5 px-4 py-2 text-[15px] text-ink outline-none placeholder:text-faint [&::-webkit-search-cancel-button]:hidden",
                                FIELD_FOCUS,
                              )}
                            />
                          </motion.div>

                          <motion.ul
                            variants={{ hidden: {}, show: {} }}
                            className={cn("flex flex-1 flex-col gap-1 overflow-y-auto px-4 pb-4", NO_SCROLLBAR)}
                          >
                            {activeOptions.map((option, index) => {
                              const selected = filters.some(
                                (f) => f.category === active.label && f.value === option.value,
                              );
                              return (
                                <motion.li key={option.value} variants={OPTION} custom={index}>
                                  <button
                                    type="button"
                                    aria-pressed={selected}
                                    onClick={() => toggleOption(active.label, option)}
                                    className={cn(
                                      "font-body flex w-full items-center justify-between rounded-panel px-3 py-2 text-lg font-semibold transition-colors",
                                      FOCUS,
                                      selected ? SELECTED : cn("text-ink", ROW_HOVER),
                                    )}
                                  >
                                    <span className="flex items-center gap-2">
                                      {option.colour && (
                                        <span
                                          aria-hidden="true"
                                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                                          style={{ backgroundColor: option.colour }}
                                        />
                                      )}
                                      {option.label}
                                    </span>
                                    {selected && <Check className={cn("h-4 w-4", ACCENT_TEXT)} />}
                                  </button>
                                </motion.li>
                              );
                            })}

                            {/* Its own initial/animate, never the staggered variant:
                                an empty result must not wait on orchestration, or it
                                looks identical to a search that has not run. */}
                            {activeOptions.length === 0 && (
                              <motion.li
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={t({ duration: 0.2, ease: EASE })}
                                className="font-body px-3 py-3 text-[15px] text-dim"
                                role="status"
                              >
                                {trimmedOptionQuery
                                  ? `No match for “${trimmedOptionQuery}”.`
                                  : "Nothing to filter by here."}
                              </motion.li>
                            )}
                          </motion.ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Under the pill, never above it: a chip row above would push the pill
          down the moment a filter is picked. The margin grows with the open
          card, on the card's own transition, so the row rides down to sit just
          past the card's real bottom edge and back up in step. */}
      {chipsBelow && (
        <motion.div
          initial={false}
          animate={{ marginTop: open ? (panelBodyHeight ?? 0) : 0 }}
          transition={t({ duration: 0.7, ease: EASE })}
          className="relative z-[60] flex flex-wrap items-center gap-2 px-2 empty:hidden"
        >
          <AnimatePresence>{filters.map(chip)}</AnimatePresence>
          {(filters.length > 0 || typing) && (
            <button
              type="button"
              onClick={clearAll}
              className={cn("font-body ml-1 text-[13px] font-medium text-faint transition-colors hover:text-ink", FOCUS)}
            >
              Clear filters
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}
