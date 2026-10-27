"use client";

import * as React from "react";
import { motion, useReducedMotionConfig, type Transition } from "motion/react";
import { ChevronDown, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * A short to-do card: a title, an "n of m" count, a springy progress bar and
 * the steps. A done step gets a filled tick that pops in and a hand-drawn
 * scribble that strikes its title through; on first show, the done steps draw
 * their scribbles one after another in reading order, never all at once.
 *
 * Steps can lead somewhere (`href` or `onItemClick`), be ticked by hand
 * (`onToggle`), or both. Without `onToggle` the tick is a read-out of `done`,
 * which is the right shape when the step is marked done by doing the thing
 * elsewhere rather than by clicking a box.
 *
 * On a phone (`fold="mobile"`) the card rests as its header and progress bar
 * and a tap unfolds the steps; `collapsed` turns it into a square count chip
 * for an icon-only rail.
 */

export type TodoItem = {
  id: string;
  title: string;
  done: boolean;
  /** Where the step leads. Renders the title as a link. */
  href?: string;
};

export type TodoListProps = {
  items: TodoItem[];
  /** Ticks or unticks a step. Without it the ticks are read-only. May return a Promise; the tick shows the new state until it settles, and reverts if it rejects. */
  onToggle?: (id: string, done: boolean) => void | Promise<void>;
  /** A step's title was activated. Fires alongside the link when the item has an href. */
  onItemClick?: (item: TodoItem) => void;
  /** Card heading. Defaults to "Getting started". */
  title?: string;
  /** Square count chip instead of the card, for a collapsed sidebar rail. */
  collapsed?: boolean;
  /** Where the collapsed chip leads. Without it the chip is a button firing onCollapsedClick. */
  collapsedHref?: string;
  onCollapsedClick?: () => void;
  /**
   * When the steps hide behind a tap on the header. "mobile" (the default)
   * folds below the md breakpoint only; "always" folds at every width.
   */
  fold?: "never" | "mobile" | "always";
  /** Colour of the ticks, scribbles and progress bar. Defaults to brand. */
  tone?: "brand" | "lead" | "go";
  className?: string;
};

const TONES = {
  brand: { fill: "bg-brand", stroke: "stroke-brand", text: "text-brand" },
  lead: { fill: "bg-lead", stroke: "stroke-lead", text: "text-lead" },
  go: { fill: "bg-go", stroke: "stroke-go", text: "text-go" },
} as const;

/** Done steps draw one after another in reading order, never all at once. */
const SCRIBBLE_STAGGER_S = 0.3;
const SCRIBBLE_DRAW_S = 0.7;

const SCRIBBLE_PATH =
  "M 10 16.91 s 79.8 -11.36 98.1 -11.34 c 22.2 0.02 -47.82 14.25 -33.39 22.02 c 12.61 6.77 124.18 -27.98 133.31 -17.28 c 7.52 8.38 -26.8 20.02 4.61 22.05 c 24.55 1.93 113.37 -20.36 113.37 -20.36";

const pathAnimate = (checked: boolean) => ({
  pathLength: checked ? 1 : 0,
  opacity: checked ? 1 : 0,
});

const pathTransition = (checked: boolean, delay: number): Transition => ({
  pathLength: { duration: SCRIBBLE_DRAW_S, ease: "easeInOut", delay: checked ? delay : 0 },
  opacity: { duration: 0.01, delay: checked ? delay : SCRIBBLE_DRAW_S },
});

const TICK_SPRING = { type: "spring", stiffness: 400, damping: 25 } as const;

export function TodoList({
  items,
  onToggle,
  onItemClick,
  title = "Getting started",
  collapsed = false,
  collapsedHref,
  onCollapsedClick,
  fold = "mobile",
  tone = "brand",
  className,
}: TodoListProps) {
  const reduceMotion = useReducedMotionConfig();
  const listId = React.useId();
  const colours = TONES[tone];

  const [expanded, setExpanded] = React.useState(false);
  // Optimistic ticks while an onToggle promise is in flight.
  const [pending, setPending] = React.useState<Record<string, boolean>>({});
  // Steps ticked by hand draw at once; only the first-show sequence staggers.
  const [touched, setTouched] = React.useState<ReadonlySet<string>>(() => new Set());

  const isDone = (item: TodoItem) => pending[item.id] ?? item.done;
  const completed = items.filter(isDone).length;
  const total = items.length;
  const progressPercent = total === 0 ? 0 : Math.round((completed / total) * 100);
  const allDone = total > 0 && completed >= total;

  const toggle = async (item: TodoItem) => {
    if (!onToggle) return;
    const next = !isDone(item);
    setTouched((prev) => new Set(prev).add(item.id));
    setPending((prev) => ({ ...prev, [item.id]: next }));
    try {
      await onToggle(item.id, next);
    } catch {
      // Falls back to the item's own `done`, which is the revert.
    } finally {
      setPending((prev) => {
        const rest = { ...prev };
        delete rest[item.id];
        return rest;
      });
    }
  };

  if (collapsed) {
    const label = `${title} (${completed} of ${total} complete)`;
    const chipClass =
      "group relative mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-rule bg-card text-ink transition-all hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
    const chipBody = (
      <>
        {allDone ? (
          <Sparkles className={cn("h-4 w-4", colours.text)} aria-hidden="true" />
        ) : (
          <span className="font-body text-xs font-black" aria-hidden="true">
            {completed}/{total}
          </span>
        )}
        <span
          className={cn("absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full border-2 border-card", colours.fill)}
          aria-hidden="true"
        />
      </>
    );
    return collapsedHref ? (
      <a href={collapsedHref} aria-label={label} title={label} className={cn(chipClass, className)}>
        {chipBody}
      </a>
    ) : (
      <button
        type="button"
        onClick={onCollapsedClick}
        aria-label={label}
        title={label}
        className={cn(chipClass, className)}
      >
        {chipBody}
      </button>
    );
  }

  // Fold classes: which width the fold button shows at, and which hides the list.
  const foldButtonClass = { never: "hidden", mobile: "md:hidden", always: "" }[fold];
  const staticSummaryClass = { never: "", mobile: "max-md:hidden", always: "hidden" }[fold];
  const listHiddenClass = expanded ? "" : { never: "", mobile: "max-md:hidden", always: "hidden" }[fold];

  // Title, count and progress bar: the whole card when folded, the top of it
  // otherwise. A half-filled bar stays in the folded row as the nudge to finish.
  const summary = (
    <>
      <span className="flex items-center justify-between gap-2">
        {/* A span, not a heading: on a phone this sits inside the fold's
            button, and a button may only hold phrasing content. */}
        <span className="font-body text-xs leading-[1.5] font-semibold tracking-[-0.03em] text-ink">
          {title}
        </span>
        <span className="flex items-center gap-1 text-[11px] font-semibold tracking-wide text-dim">
          {completed} of {total}
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "size-3.5 transition-transform duration-200",
              foldButtonClass,
              expanded && "rotate-180",
            )}
          />
        </span>
      </span>

      <span className="mt-2.5 block h-1.5 w-full overflow-hidden rounded-full bg-paper-sunk">
        <motion.span
          className={cn("block h-full rounded-full", colours.fill)}
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30 }}
        />
      </span>
    </>
  );

  return (
    <div
      className={cn(
        "relative rounded-panel border border-rule bg-card/90 p-4 font-body text-ink transition-all duration-300",
        fold === "mobile" && "max-md:py-3",
        fold === "always" && "py-3",
        className,
      )}
    >
      {/* Folding widths: the summary is the fold's button. Elsewhere it is
          plain text, since a button that does nothing would still be a tab stop. */}
      {fold !== "never" && (
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={expanded}
          aria-controls={listId}
          className={cn(
            "-m-1.5 block w-[calc(100%+0.75rem)] cursor-pointer rounded-lg p-1.5 text-left focus-visible:ring-2 focus-visible:ring-lead/40 focus-visible:outline-none",
            foldButtonClass,
          )}
        >
          {summary}
        </button>
      )}
      <div className={staticSummaryClass}>{summary}</div>

      {/* Keyed on the fold so each unfolding remounts the list and the done
          steps draw their scribbles again. */}
      <ul key={expanded ? "unfolded" : "folded"} id={listId} className={cn("mt-3.5 space-y-2", listHiddenClass)}>
        {items.map((item, index) => {
          const done = isDone(item);
          const delay = touched.has(item.id) ? 0 : index * SCRIBBLE_STAGGER_S;

          const tick = (
            <span
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-all duration-200",
                done
                  ? cn(colours.fill, "text-on-solid shadow-xs")
                  : "border border-faint text-transparent group-hover:border-dim",
              )}
            >
              <motion.span
                aria-hidden="true"
                initial={false}
                animate={{ scale: done ? 1 : 0, opacity: done ? 1 : 0 }}
                transition={reduceMotion ? { duration: 0 } : TICK_SPRING}
              >
                ✓
              </motion.span>
            </span>
          );

          // Shrink-wrapped so the scribble ends where the text ends; truncation
          // lives on the inner span, so a long title still ellipsizes and the
          // scribble matches the visible width.
          const label = (
            <span className="relative inline-block max-w-full">
              <span
                className={cn(
                  "block truncate transition-colors duration-200",
                  done ? "font-normal text-faint" : "font-medium text-ink/85 group-hover:text-ink",
                )}
              >
                {item.title}
              </span>
              <motion.svg
                width="220"
                height="24"
                viewBox="0 0 340 32"
                preserveAspectRatio="none"
                aria-hidden="true"
                // Taller than the line so the wave's loops fit; overflow-visible
                // because the lowest loop overshoots the viewBox.
                className="pointer-events-none absolute top-1/2 left-0 z-20 h-8 w-full -translate-y-1/2 overflow-visible"
              >
                <motion.path
                  d={SCRIBBLE_PATH}
                  vectorEffect="non-scaling-stroke"
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  strokeMiterlimit={10}
                  fill="none"
                  // Mount from undrawn so done steps draw each time the list
                  // appears. Undone steps rest at zero, so nothing flashes.
                  initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
                  animate={pathAnimate(done)}
                  transition={reduceMotion ? { duration: 0 } : pathTransition(done, delay)}
                  className={colours.stroke}
                />
              </motion.svg>
              <span className="sr-only">{done ? " (done)" : " (not done)"}</span>
            </span>
          );

          const rowClass =
            "group -mx-1.5 flex items-center gap-2.5 rounded-lg px-1.5 py-2.5 text-xs transition-colors hover:bg-paper";
          const titleBox = <span className="min-w-0 flex-1">{label}</span>;
          const goesSomewhere = Boolean(item.href || onItemClick);
          const focusClass =
            "focus-visible:ring-2 focus-visible:ring-lead/40 focus-visible:outline-none";

          // Read-only ticks: the whole row is the link, as in a nav list.
          if (!onToggle) {
            return (
              <li key={item.id}>
                {item.href ? (
                  <a href={item.href} onClick={() => onItemClick?.(item)} className={cn(rowClass, focusClass)}>
                    {tick}
                    {titleBox}
                  </a>
                ) : onItemClick ? (
                  <button
                    type="button"
                    onClick={() => onItemClick(item)}
                    className={cn(rowClass, focusClass, "w-[calc(100%+0.75rem)] text-left")}
                  >
                    {tick}
                    {titleBox}
                  </button>
                ) : (
                  <div className={rowClass}>
                    {tick}
                    {titleBox}
                  </div>
                )}
              </li>
            );
          }

          // Tickable: the tick is its own checkbox, and the title leads
          // somewhere if it can, or ticks the box if it cannot.
          return (
            <li key={item.id} className={rowClass}>
              <button
                type="button"
                role="checkbox"
                aria-checked={done}
                aria-label={item.title}
                onClick={() => void toggle(item)}
                className={cn(
                  "relative -m-1 shrink-0 rounded-full p-1",
                  focusClass,
                  "pointer-coarse:after:absolute pointer-coarse:after:top-1/2 pointer-coarse:after:left-1/2 pointer-coarse:after:size-11 pointer-coarse:after:-translate-x-1/2 pointer-coarse:after:-translate-y-1/2 pointer-coarse:after:content-['']",
                )}
              >
                {tick}
              </button>
              {item.href ? (
                <a
                  href={item.href}
                  onClick={() => onItemClick?.(item)}
                  className={cn("min-w-0 flex-1 rounded-sm", focusClass)}
                >
                  {label}
                </a>
              ) : goesSomewhere ? (
                <button
                  type="button"
                  onClick={() => onItemClick?.(item)}
                  className={cn("min-w-0 flex-1 rounded-sm text-left", focusClass)}
                >
                  {label}
                </button>
              ) : (
                <span
                  className="min-w-0 flex-1 cursor-pointer"
                  onClick={() => void toggle(item)}
                  aria-hidden="true"
                >
                  {label}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
