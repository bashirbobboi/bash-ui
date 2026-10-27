"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { useReducedMotionConfig } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * The same bad-to-good ramp as `RangeSlider`, kept in this file so the stick
 * slider installs and runs on its own. Positions are mixed between the
 * contract's ramp and state tokens, so they follow the theme and the mode.
 */
const RAMP: readonly (readonly [number, string])[] = [
  [0, "var(--stop)"],
  [0.3, "var(--ramp-orange)"],
  [0.55, "var(--milestone-yellow)"],
  [0.78, "var(--go-pale)"],
  [1, "var(--go)"],
];

function stickRampColorAt(ratio: number): string {
  const t = Math.max(0, Math.min(1, ratio));
  for (let i = 0; i < RAMP.length - 1; i++) {
    const [t0, c0] = RAMP[i];
    const [t1, c1] = RAMP[i + 1];
    if (t <= t1) {
      const local = Math.round(((t - t0) / (t1 - t0)) * 100);
      if (local <= 0) return c0;
      if (local >= 100) return c1;
      return `color-mix(in oklab, ${c1} ${local}%, ${c0})`;
    }
  }
  return RAMP[RAMP.length - 1][1];
}

export interface StickSliderProps {
  id?: string;
  /** Form field name: the slider is a real `<input type="range">`, so it submits. */
  name?: string;
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  /**
   * Shows the real colour at full strength with no handle and nothing to drag.
   * Not `disabled`, which greys the row out and hides the thing being read.
   */
  readOnly?: boolean;
  className?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-valuetext"?: string;
  /** Colour for a position along the track, 0-1. Defaults to the ramp, red to green. */
  colorAt?: (ratio: number) => string;
  /** Distance between stick centres in px. */
  pitch?: number;
  stickWidth?: number;
  stickHeight?: number;
  /**
   * How fast the liquid catches the handle, as a fraction of the remaining gap
   * per frame (default 0.1). Lower is slower and more viscous.
   */
  gooChase?: number;
}

const HANDLE_SIZE = 18;
const HANDLE_GAP = 5;

/**
 * A single-value slider drawn as a row of rounded sticks.
 *
 * The sticks are decoration over a real range input stretched invisibly across
 * them, so dragging, clicking the track, arrow keys, touch and screen readers
 * all behave like a native slider. Every filled stick takes the ramp's colour
 * at the current position, and the stroke transitions, so dragging right fades
 * the whole fill from red through amber into green. The round handle sits just
 * past the last filled stick and stretches into a liquid streak as it is
 * dragged, settling back into a circle.
 */
export function StickSlider({
  id,
  name,
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  readOnly = false,
  className,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
  "aria-valuetext": ariaValueText,
  colorAt = stickRampColorAt,
  pitch = 8.5,
  stickWidth = 3,
  stickHeight = 18,
  gooChase = 0.1,
}: StickSliderProps) {
  const fallbackId = useId();
  const reduceMotion = useReducedMotionConfig();
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  // Where the liquid has got to, as opposed to where the handle is. It chases
  // the handle a frame at a time and the capsule is drawn spanning the two.
  // Written straight to the node: it changes every frame of a drag.
  const trailElRef = useRef<HTMLSpanElement>(null);
  const trailXRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    // ResizeObserver reports the first size on observe, so no initial read.
    const observer = new ResizeObserver(([entry]) => {
      if (entry && entry.contentRect.width > 0) setWidth(entry.contentRect.width);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const range = max - min;
  const ratio = range > 0 ? Math.max(0, Math.min(1, (value - min) / range)) : 0;

  // The sticks leave room for the handle at the right end, so at 100% it still
  // lands inside the row. Read-only has no handle and takes the space back.
  const handleSpace = readOnly ? 0 : HANDLE_GAP + HANDLE_SIZE;

  const effectiveWidth = width > 0 ? width : 600;
  const trackStart = stickWidth / 2;
  const available = Math.max(1, effectiveWidth - stickWidth - handleSpace);
  const intervals = Math.max(12, Math.round(available / pitch));
  const totalTicks = intervals + 1;
  const spacing = available / intervals;
  const activeCount = ratio === 0 ? 0 : Math.max(1, Math.round(ratio * totalTicks));

  const top = 3;
  const svgHeight = stickHeight + 6;
  const fill = colorAt(ratio);
  const handleX =
    activeCount === 0
      ? HANDLE_SIZE / 2
      : trackStart + (activeCount - 1) * spacing + stickWidth / 2 + HANDLE_GAP + HANDLE_SIZE / 2;

  useEffect(() => {
    if (readOnly) return;

    // The capsule spans from the handle back to where the liquid has got to.
    // It thins slightly as it stretches, and at rest it is a circle on the handle.
    const paint = (x: number) => {
      const node = trailElRef.current;
      if (!node) return;
      const lag = Math.abs(handleX - x);
      const squash = 1 - (Math.min(lag, HANDLE_SIZE * 2) / (HANDLE_SIZE * 2)) * 0.18;
      node.style.left = `${Math.min(handleX, x) - HANDLE_SIZE / 2}px`;
      node.style.width = `${lag + HANDLE_SIZE}px`;
      node.style.height = `${HANDLE_SIZE * squash}px`;
    };

    // Reduced motion, and the first paint, put the liquid straight on the handle.
    if (reduceMotion || trailXRef.current === null) {
      trailXRef.current = handleX;
      paint(handleX);
      return;
    }

    const tick = () => {
      const current = trailXRef.current ?? handleX;
      const distance = handleX - current;
      if (Math.abs(distance) < 0.4) {
        trailXRef.current = handleX;
        paint(handleX);
        frameRef.current = null;
        return;
      }
      trailXRef.current = current + distance * gooChase;
      paint(trailXRef.current);
      frameRef.current = requestAnimationFrame(tick);
    };
    if (frameRef.current === null) frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [handleX, gooChase, readOnly, reduceMotion]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "group relative w-full rounded-inset has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-lead/30 has-[:focus-visible]:ring-offset-4 has-[:focus-visible]:ring-offset-card",
        disabled && !readOnly && "opacity-50",
        className,
      )}
    >
      <svg aria-hidden="true" className="block w-full overflow-visible" height={svgHeight}>
        {Array.from({ length: totalTicks }, (_, index) => {
          const isActive = index < activeCount;
          const x = trackStart + index * spacing;
          return (
            <line
              key={index}
              x1={x}
              x2={x}
              y1={top}
              y2={top + stickHeight}
              // `style`, not `stroke={...}`: a color-mix() or var() colour is CSS,
              // which a presentation attribute does not parse.
              style={{ stroke: isActive ? fill : "var(--rule-soft)" }}
              strokeWidth={stickWidth}
              strokeLinecap="round"
              className="transition-[stroke] duration-300 ease-out motion-reduce:transition-none"
            />
          );
        })}
      </svg>

      {/* One capsule pinned at the handle and stretched back toward where it was
          dragged from. Geometry is owned by the effect above, not by JSX, so a
          re-render mid-drag does not snap it back to a circle. */}
      {!readOnly && (
        <span
          ref={trailElRef}
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-0 size-[18px] -translate-y-1/2 rounded-full bg-slider-handle shadow-sm ring-1 ring-rule-soft"
        />
      )}

      <input
        id={id ?? fallbackId}
        name={name}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled || readOnly}
        onChange={(event) => onValueChange(Number(event.target.value))}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-valuetext={ariaValueText}
        style={{ "--thumb-size": `${HANDLE_SIZE}px` } as CSSProperties}
        className="absolute inset-0 z-10 h-full w-full cursor-grab appearance-none opacity-0 active:cursor-grabbing disabled:cursor-default [&::-moz-range-thumb]:size-[var(--thumb-size)] [&::-moz-range-thumb]:border-0 [&::-webkit-slider-thumb]:size-[var(--thumb-size)] [&::-webkit-slider-thumb]:appearance-none"
      />
    </div>
  );
}
