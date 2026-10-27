"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/* ─── The ramp ─────────────────────────────────────────────────────────── */

/**
 * Bad-to-good colour stops, by position along the track. Every colour is a
 * contract token, so the ramp follows the theme and the mode.
 */
const RAMP_STOPS: readonly { at: number; color: string }[] = [
  { at: 0, color: "var(--stop)" },
  { at: 0.3, color: "var(--ramp-orange)" },
  { at: 0.55, color: "var(--milestone-yellow)" },
  { at: 0.78, color: "var(--go-pale)" },
  { at: 1, color: "var(--go)" },
];

/**
 * The colour of the bad-to-good ramp at `ratio` (0 = left, 1 = right), as a
 * CSS string. Between two stops it is a `color-mix()` the browser resolves,
 * so nothing here reads computed styles.
 */
export function rampColorAt(ratio: number): string {
  const t = Number.isFinite(ratio) ? Math.min(1, Math.max(0, ratio)) : 0;
  const upper = Math.max(1, RAMP_STOPS.findIndex((stop) => t <= stop.at));
  const from = RAMP_STOPS[upper - 1];
  const to = RAMP_STOPS[upper];
  const share = Math.round(((t - from.at) / (to.at - from.at)) * 100);
  if (share <= 0) return from.color;
  if (share >= 100) return to.color;
  return `color-mix(in oklab, ${to.color} ${share}%, ${from.color})`;
}

/* ─── Scales ───────────────────────────────────────────────────────────── */

/**
 * The places a thumb can rest, numbered 0..`top`. Thumbs and keys work in
 * these whole-number positions; values only appear at the edges, so a step of
 * 0.1 never accumulates float noise.
 */
interface Scale {
  /** The highest position. Always at least 1, so two thumbs fit. */
  top: number;
  valueAt(position: number): number;
  /** The resting position nearest to any value. */
  nearest(value: number): number;
  /** Where a position sits along the track, 0-1. */
  ratioAt(position: number): number;
  /** The resting position nearest to a point along the track, 0-1. */
  atRatio(ratio: number): number;
}

const clamp = (n: number, low: number, high: number) => Math.min(high, Math.max(low, n));

/** How many decimal places `n` is written with, exponent form included. */
function decimalPlaces(n: number): number {
  if (!Number.isFinite(n) || Number.isInteger(n)) return 0;
  const [digits, exponent] = n.toExponential().split("e");
  const fraction = digits.split(".")[1]?.length ?? 0;
  return Math.max(0, fraction - Number(exponent));
}

/**
 * Evenly spaced values from `min` by `step`. When `step` does not divide the
 * range, `max` is kept as one shorter final step so the range stays reachable.
 */
function linearScale(min: number, max: number, step: number): Scale {
  const size = Number.isFinite(step) && step > 0 ? step : 1;
  const end = max > min ? max : min + size;
  const places = Math.max(decimalPlaces(size), decimalPlaces(min));
  const tidy = (n: number) => Number(n.toFixed(places));
  const fullSteps = Math.floor((end - min) / size + 1e-9);
  const shortTail = tidy(min + fullSteps * size) < end;
  const top = Math.max(1, fullSteps + (shortTail ? 1 : 0));

  const valueAt = (position: number) => {
    if (position >= top) return end;
    return tidy(min + Math.max(0, position) * size);
  };

  const nearest = (value: number) => {
    if (Number.isNaN(value) || value <= min) return 0;
    if (value >= end) return top;
    const lastWhole = valueAt(fullSteps);
    if (shortTail && value > lastWhole) {
      // Between the last whole step and `max`: whichever is closer.
      return value - lastWhole <= end - value ? fullSteps : top;
    }
    return clamp(Math.round((value - min) / size), 0, top);
  };

  return {
    top,
    valueAt,
    nearest,
    ratioAt: (position) => (valueAt(position) - min) / (end - min),
    atRatio: (ratio) => nearest(min + clamp(ratio, 0, 1) * (end - min)),
  };
}

/** A listed set of values, each an equal distance along the track. */
function listedScale(stops: readonly number[]): Scale {
  const top = stops.length - 1;
  return {
    top,
    valueAt: (position) => stops[clamp(position, 0, top)],
    nearest: (value) => {
      let best = 0;
      for (let i = 1; i <= top; i++) {
        if (Math.abs(stops[i] - value) < Math.abs(stops[best] - value)) best = i;
      }
      return best;
    },
    ratioAt: (position) => position / top,
    atRatio: (ratio) => Math.round(clamp(ratio, 0, 1) * top),
  };
}

/* ─── Helpers ──────────────────────────────────────────────────────────── */

type Pair = [number, number];

/** 0 is the minimum thumb, 1 the maximum. */
type Side = 0 | 1;

const SIDES: readonly Side[] = [0, 1];

/**
 * Resting positions for any pair of values: ordered, snapped, and at least
 * one position apart.
 */
function settle(scale: Scale, [a, b]: Pair): Pair {
  const low = Math.min(scale.nearest(Math.min(a, b)), scale.top - 1);
  const high = Math.max(scale.nearest(Math.max(a, b)), low + 1);
  return [low, high];
}

/** `pair` with one thumb sent towards `target`, stopped short of the other. */
function shift(pair: Pair, side: Side, target: number, top: number): Pair {
  const [low, high] = pair;
  return side === 0 ? [clamp(target, 0, high - 1), high] : [low, clamp(target, low + 1, top)];
}

/**
 * A ratio as a CSS percentage, rounded so the server and the browser print
 * the same string and hydration matches.
 */
const percent = (ratio: number) => `${Number((ratio * 100).toFixed(4))}%`;

const defaultFormat = (value: number) => value.toLocaleString();

/** Ramp samples for the rail's gradient: every 5%. */
const RAIL_SAMPLES = 21;

/* ─── Component ────────────────────────────────────────────────────────── */

export interface RangeSliderProps
  extends Omit<React.ComponentProps<"div">, "defaultValue" | "title" | "children" | "onChange"> {
  /** Lowest value of a linear scale. Default 0. Ignored when `stops` is given. */
  min?: number;
  /** Highest value of a linear scale. Default 100. Ignored when `stops` is given. */
  max?: number;
  /** Distance between resting values on a linear scale. Default 1. Ignored when `stops` is given. */
  step?: number;
  /**
   * A non-linear scale: the only values a thumb can rest on, ascending, each
   * an equal distance along the track. Values in and out are these numbers;
   * one that is not listed settles on the nearest.
   */
  stops?: readonly number[];
  /** The selected range, controlled. */
  value?: [number, number];
  /** The starting range, uncontrolled. Defaults to the whole scale. */
  defaultValue?: [number, number];
  /** Every change while dragging or keying. Not called when nothing moved. */
  onValueChange?: (value: [number, number]) => void;
  /** Once when a drag ends, and once per handled key press. */
  onValueCommit?: (value: [number, number]) => void;
  /** How a value reads in the readout and to screen readers. */
  formatValue?: (value: number) => string;
  /** Histogram bar heights, in any unit; drawn left to right behind the thumbs. */
  data?: readonly number[];
  /** Hover text for a histogram bar. */
  barLabel?: (index: number) => string | undefined;
  /** Draw the histogram when `data` is given. Default true; otherwise a thin rail. */
  showHistogram?: boolean;
  /** Height classes for the histogram area. Default "h-36 sm:h-40". */
  histogramHeight?: string;
  /** "ramp" colours the selection bad-to-good; "primary" uses one fill. */
  colorScheme?: "ramp" | "primary";
  /** A CSS colour for a position 0-1. Defaults to `rampColorAt`. */
  colorAt?: (ratio: number) => string;
  /** A heading above the slider. */
  title?: React.ReactNode;
  /** The minimum's readout heading and thumb name. Default "Minimum". */
  minLabel?: string;
  /** The maximum's readout heading and thumb name. Default "Maximum". */
  maxLabel?: string;
  /** A line under the minimum figure; a function receives the current value. */
  minSubtitle?: React.ReactNode | ((value: number) => React.ReactNode);
  /** A line under the maximum figure; a function receives the current value. */
  maxSubtitle?: React.ReactNode | ((value: number) => React.ReactNode);
  /** The two large figures under the track. Default true. */
  showReadout?: boolean;
  disabled?: boolean;
}

/** An in-progress pointer drag. Lives in a ref: it changes every pointermove. */
interface Drag {
  pointerId: number;
  side: Side;
  /** Pointer distance from the thumb's centre when it was grabbed, in px. */
  offset: number;
  /** The latest positions, ahead of any re-render. */
  pair: Pair;
}

/**
 * A two-thumb range slider, optionally over a histogram whose bars inside the
 * range take the ramp colour of where they stand, with both ends read out
 * large underneath.
 *
 * Press a thumb to drag it; press the track with a mouse or pen to bring the
 * nearer thumb there and keep dragging. On touch only the thumbs grab, so a
 * swipe across the bars still scrolls the page. Each thumb is a keyboard
 * slider: arrows, Page Up/Down, Home and End.
 */
export function RangeSlider({
  min = 0,
  max = 100,
  step = 1,
  stops,
  value,
  defaultValue,
  onValueChange,
  onValueCommit,
  formatValue = defaultFormat,
  data,
  barLabel,
  showHistogram = true,
  histogramHeight = "h-36 sm:h-40",
  colorScheme = "ramp",
  colorAt = rampColorAt,
  title,
  minLabel = "Minimum",
  maxLabel = "Maximum",
  minSubtitle,
  maxSubtitle,
  showReadout = true,
  disabled = false,
  className,
  ...rest
}: RangeSliderProps) {
  const scale = React.useMemo(
    () => (stops && stops.length >= 2 ? listedScale(stops) : linearScale(min, max, step)),
    [stops, min, max, step],
  );

  const [uncontrolled, setUncontrolled] = React.useState<Pair>(
    () => defaultValue ?? [scale.valueAt(0), scale.valueAt(scale.top)],
  );
  const isControlled = value !== undefined;
  const pair = settle(scale, isControlled ? value : uncontrolled);
  const values: Pair = [scale.valueAt(pair[0]), scale.valueAt(pair[1])];
  const ratios: Pair = [scale.ratioAt(pair[0]), scale.ratioAt(pair[1])];

  const [dragging, setDragging] = React.useState<Side | null>(null);
  const dragRef = React.useRef<Drag | null>(null);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const thumbRefs = React.useRef<(HTMLButtonElement | null)[]>([null, null]);
  const titleId = React.useId();

  const ramp = colorScheme === "ramp";
  const bars = showHistogram && data && data.length > 0 ? data : null;
  const toValues = (positions: Pair): Pair => [scale.valueAt(positions[0]), scale.valueAt(positions[1])];

  /** Report `next` if it differs from `previous`. Returns whether it did. */
  function change(previous: Pair, next: Pair): boolean {
    if (previous[0] === next[0] && previous[1] === next[1]) return false;
    const nextValues = toValues(next);
    if (!isControlled) setUncontrolled(nextValues);
    onValueChange?.(nextValues);
    return true;
  }

  /** The resting position under a pointer's x coordinate. */
  function positionAt(clientX: number): number {
    const box = trackRef.current?.getBoundingClientRect();
    if (!box || box.width === 0) return 0;
    return scale.atRatio((clientX - box.left) / box.width);
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (disabled || dragRef.current || !event.isPrimary) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    const thumb = (event.target as Element).closest<HTMLButtonElement>("[data-thumb]");
    const onThumb = thumb !== null && event.currentTarget.contains(thumb);
    // On touch the track is left to the page, so a swipe over it scrolls.
    if (!onThumb && event.pointerType === "touch") return;

    let side: Side;
    let offset = 0;
    let target: number | null = null;
    if (onThumb) {
      side = thumb.dataset.thumb === "max" ? 1 : 0;
      const knob = thumb.getBoundingClientRect();
      offset = event.clientX - (knob.left + knob.width / 2);
    } else {
      target = positionAt(event.clientX);
      const ratio = scale.ratioAt(target);
      // The nearer thumb answers; a tie goes to the minimum.
      side = Math.abs(ratio - ratios[0]) <= Math.abs(ratio - ratios[1]) ? 0 : 1;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    thumbRefs.current[side]?.focus({ preventScroll: true });

    const drag: Drag = { pointerId: event.pointerId, side, offset, pair };
    if (target !== null) {
      const next = shift(pair, side, target, scale.top);
      if (change(pair, next)) drag.pair = next;
    }
    dragRef.current = drag;
    setDragging(side);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId || disabled) return;
    const next = shift(drag.pair, drag.side, positionAt(event.clientX - drag.offset), scale.top);
    if (change(drag.pair, next)) drag.pair = next;
  }

  /** Ends a drag on release, cancel, or lost capture; commits exactly once. */
  function handlePointerEnd(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setDragging(null);
    onValueCommit?.(toValues(drag.pair));
  }

  function handleKeyDown(side: Side, event: React.KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    const big = Math.max(1, Math.round(scale.top / 10));
    const here = pair[side];
    let target: number;
    switch (event.key) {
      case "ArrowLeft":
      case "ArrowDown":
        target = here - 1;
        break;
      case "ArrowRight":
      case "ArrowUp":
        target = here + 1;
        break;
      case "PageDown":
        target = here - big;
        break;
      case "PageUp":
        target = here + big;
        break;
      case "Home":
        target = side === 0 ? 0 : pair[0] + 1;
        break;
      case "End":
        target = side === 1 ? scale.top : pair[1] - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    const next = shift(pair, side, target, scale.top);
    change(pair, next);
    onValueCommit?.(toValues(next));
  }

  const railGradient =
    !bars && ramp
      ? `linear-gradient(to right, ${Array.from({ length: RAIL_SAMPLES }, (_, i) => {
          const at = i / (RAIL_SAMPLES - 1);
          return `${colorAt(at)} ${percent(at)}`;
        }).join(", ")})`
      : undefined;

  const tallest = bars ? Math.max(0, ...bars) : 0;
  const subtitles = [minSubtitle, maxSubtitle];
  const labels = [minLabel, maxLabel];

  return (
    <div
      data-slot="range-slider"
      data-disabled={disabled || undefined}
      role="group"
      aria-labelledby={title ? titleId : undefined}
      className={cn("@container w-full px-4 font-body", disabled && "opacity-50", className)}
      {...rest}
    >
      {title ? (
        <div id={titleId} className="mb-6 text-center text-lg font-medium text-ink">
          {title}
        </div>
      ) : null}

      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onLostPointerCapture={handlePointerEnd}
        className={cn(
          "relative w-full select-none",
          bars ? histogramHeight : "h-10",
          disabled ? "cursor-default" : dragging !== null ? "cursor-grabbing" : "cursor-pointer",
        )}
      >
        {bars ? (
          <div aria-hidden="true" className="absolute inset-0 flex items-end gap-px">
            {bars.map((height, index) => {
              const at = bars.length > 1 ? index / (bars.length - 1) : 0;
              // A hair of tolerance: `at` and the thumb ratios are divided differently.
              const selected = at >= ratios[0] - 1e-9 && at <= ratios[1] + 1e-9;
              const share = tallest > 0 ? Math.max(0, height) / tallest : 0;
              return (
                <div
                  key={index}
                  title={barLabel?.(index)}
                  className={cn(
                    "flex-1 rounded-t-sm transition-[background-color,height] duration-200 ease-out motion-reduce:transition-none",
                    !selected ? "bg-paper-sunk" : !ramp && "bg-primary",
                  )}
                  style={{
                    height: percent(Math.max(0.08, share)),
                    backgroundColor: selected && ramp ? colorAt(at) : undefined,
                  }}
                />
              );
            })}
          </div>
        ) : (
          <div
            aria-hidden="true"
            className={cn(
              "absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full",
              !ramp && "bg-primary",
            )}
            style={{ backgroundImage: railGradient }}
          >
            <div className="absolute inset-y-0 left-0 bg-paper-sunk" style={{ width: percent(ratios[0]) }} />
            <div className="absolute inset-y-0 right-0 bg-paper-sunk" style={{ left: percent(ratios[1]) }} />
          </div>
        )}

        {SIDES.map((side) => {
          const active = dragging === side;
          // Two thumbs one step apart overlap; whichever has room to move sits on top.
          const raised = side === 0 && ratios[0] > 0.5;
          return (
            <button
              key={side}
              ref={(node) => {
                thumbRefs.current[side] = node;
              }}
              type="button"
              role="slider"
              data-thumb={side === 0 ? "min" : "max"}
              disabled={disabled}
              aria-label={labels[side]}
              aria-orientation="horizontal"
              aria-valuemin={side === 0 ? scale.valueAt(0) : scale.valueAt(pair[0] + 1)}
              aria-valuemax={side === 0 ? scale.valueAt(pair[1] - 1) : scale.valueAt(scale.top)}
              aria-valuenow={values[side]}
              aria-valuetext={formatValue(values[side])}
              onKeyDown={(event) => handleKeyDown(side, event)}
              className={cn(
                "absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 touch-none rounded-full border-2 bg-slider-handle shadow-sm outline-none",
                "transition-transform duration-150 ease-out motion-reduce:transition-none",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                // A 44px target around the 20px knob.
                "after:absolute after:top-1/2 after:left-1/2 after:size-11 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:content-['']",
                !ramp && "border-primary",
                disabled ? "cursor-default" : "cursor-grab active:cursor-grabbing",
                active
                  ? "z-20 scale-125 cursor-grabbing ring-4 ring-primary/20"
                  : cn(raised ? "z-[11]" : "z-10", !disabled && "hover:scale-110"),
              )}
              style={{
                left: percent(ratios[side]),
                borderColor: ramp ? colorAt(ratios[side]) : undefined,
              }}
            />
          );
        })}
      </div>

      {showReadout ? (
        <div className="mt-6 grid grid-cols-2 gap-4">
          {SIDES.map((side) => {
            const subtitle = subtitles[side];
            const line = typeof subtitle === "function" ? subtitle(values[side]) : subtitle;
            return (
              <div key={side} className="min-w-0 text-center">
                <div className="text-[15px] text-dim @md:text-lg">{labels[side]}</div>
                <div className="mt-1 truncate text-[34px] leading-tight font-bold text-ink tabular-nums @sm:text-[44px] @xl:text-[56px]">
                  {formatValue(values[side])}
                </div>
                {line !== undefined && line !== null && typeof line !== "boolean" ? (
                  <div className="mt-0.5 text-[15px] text-dim @md:text-lg">{line}</div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
