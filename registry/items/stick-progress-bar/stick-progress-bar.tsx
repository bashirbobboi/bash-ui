"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotionConfig,
} from "motion/react";

import { cn } from "@/lib/utils";

export interface StickProgressSegment {
  id?: string;
  label: string;
  value: number;
  /** Any CSS colour; a token such as `var(--go)` keeps it on the theme. */
  color: string;
  /** Stroke while this segment is hovered. Defaults to `color`. */
  hoverColor?: string;
  /**
   * Optional colour ramp instead of one flat `color`: stops at positions along
   * the WHOLE gauge (0–1, ascending), and each stick is mixed between the two
   * stops either side of where it sits, so every stick has its own colour,
   * fixed by position, not by how full the gauge is. Two stops at (almost) the
   * same position make a hard break. Plain data, not a function, so a server
   * component can pass it. Stops can be any CSS colour, tokens included; the
   * mix is done by the browser (`color-mix`), so it follows theme switches.
   */
  ramp?: { at: number; color: string }[];
}

export interface StickProgressBarProps {
  /** Optional multi-segment configuration. Takes precedence over checked/total. */
  segments?: StickProgressSegment[];
  /** Number of items completed/checked (when segments not provided). */
  checked?: number;
  /** Total number of items (when segments not provided). */
  total?: number;
  /** Accessible label for screen readers. */
  ariaLabel?: string;
  /** Additional container styling. */
  className?: string;
  /** Active stick stroke colour. Defaults to var(--lead). */
  activeColor?: string;
  /**
   * Optional left-to-right gradient stops for the active sticks
   * (single-metric mode only; ignored when `segments` are given). Two or more
   * CSS colours; each active stick takes the colour at its own position along
   * them instead of `activeColor`. Meant for a brand mark (a model maker's
   * colours on an attribution chart), never for state.
   */
  activeGradient?: string[];
  /** Inactive stick stroke colour. Defaults to var(--rule-soft). */
  inactiveColor?: string;
  /** Stick stroke colour when hovering the inactive segment. Defaults to var(--faint). */
  hoverInactiveColor?: string;
  /** Target pitch (distance between stick centres) in px. Defaults to 8.5. */
  pitch?: number;
  /** Width (stroke width) of each vertical stick in px. Defaults to 3. */
  stickWidth?: number;
  /** Height of each stick in px. Defaults to 16. */
  stickHeight?: number;
  /** Whether to show the floating tooltip on hover. Defaults to true. */
  showTooltip?: boolean;
  /** Label for the active/checked segment in the tooltip. Defaults to "Checked". */
  checkedLabel?: string;
  /** Label for the inactive/remaining segment in the tooltip. Defaults to "Still to check". */
  remainingLabel?: string;
  /** Formatter for values in the tooltip. Defaults to .toLocaleString(). */
  valueFormatter?: (value: number) => string;
  /** Optional custom accessible value text for screen readers. */
  ariaValueText?: string;
  /**
   * Skips the scroll-reveal fade-in and renders at full opacity from the first
   * frame. For a gauge that is never below the fold when it mounts (a live
   * progress row, say), waiting on an `IntersectionObserver` is pure risk: if
   * its first callback lands while a parent entrance animation has the row at
   * zero height, it may never fire again and the track stays invisible until
   * hovered. Defaults to false so scroll-triggered charts keep their reveal.
   */
  alwaysVisible?: boolean;
}

type HoverState = {
  x: number;
  segmentIndex: number;
  segmentLabel: string;
  segmentValue: number;
  segmentPct: number;
  segmentColor: string;
};

const DEFAULT_HOVER_INACTIVE = "var(--faint)";

/** `from` blended toward `to` by `fraction` (0–1), resolved by the browser. */
function mixColour(from: string, to: string, fraction: number): string {
  const t = Math.min(1, Math.max(0, fraction));
  if (t <= 0 || from === to) return from;
  if (t >= 1) return to;
  const toPct = Math.round(t * 1000) / 10;
  return `color-mix(in oklab, ${from}, ${to} ${toPct}%)`;
}

type RampStop = { at: number; color: string };

/** The colour at position `t` (0–1) along ascending ramp stops. */
function rampStroke(stops: readonly RampStop[], t: number): string {
  if (t <= stops[0].at) return stops[0].color;
  for (let i = 1; i < stops.length; i++) {
    const from = stops[i - 1];
    const to = stops[i];
    if (t <= to.at) {
      return mixColour(from.color, to.color, (t - from.at) / Math.max(0.0001, to.at - from.at));
    }
  }
  return stops[stops.length - 1].color;
}

/** The gradient colour at position `t` (0–1) across evenly spaced `stops`. */
function sampleGradient(stops: readonly string[], t: number): string {
  const clamped = Math.min(1, Math.max(0, t)) * (stops.length - 1);
  const lower = Math.floor(clamped);
  const upper = Math.min(stops.length - 1, lower + 1);
  return mixColour(stops[lower], stops[upper], clamped - lower);
}

export function StickProgressBar({
  segments,
  checked = 0,
  total = 0,
  ariaLabel = "Progress",
  ariaValueText,
  className,
  activeColor = "var(--lead)",
  activeGradient,
  inactiveColor = "var(--rule-soft)",
  hoverInactiveColor = DEFAULT_HOVER_INACTIVE,
  pitch = 8.5,
  stickWidth = 3,
  stickHeight = 16,
  showTooltip = true,
  checkedLabel = "Checked",
  remainingLabel = "Still to check",
  valueFormatter = (v) => v.toLocaleString(),
  alwaysVisible = false,
}: StickProgressBarProps) {
  const compId = useId().replace(/:/g, "");
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotionConfig() ?? false;
  const [width, setWidth] = useState<number>(0);
  const [hasEnteredView, setHasEnteredView] = useState(alwaysVisible);
  const [hoverState, setHoverState] = useState<HoverState | null>(null);

  // Animated progress (0 to target active ticks count)
  const progressMotion = useMotionValue(0);
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const resizeObserver = new ResizeObserver(([entry]) => {
      if (entry && entry.contentRect.width > 0) {
        setWidth(entry.contentRect.width);
      }
    });
    resizeObserver.observe(node);

    // Already visible from the first frame: nothing to reveal, and nothing
    // that can get stuck waiting on a callback that may never fire again.
    if (alwaysVisible) {
      return () => resizeObserver.disconnect();
    }

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasEnteredView(true);
          intersectionObserver.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    intersectionObserver.observe(node);

    return () => {
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, [alwaysVisible]);

  const hasSegments = Boolean(segments && segments.length > 0);

  // Layout: evenly distribute sticks across the width.
  const effectiveWidth = width > 0 ? width : 800;
  const availableWidth = Math.max(1, effectiveWidth - stickWidth);
  const intervals = Math.max(12, Math.round(availableWidth / pitch));
  const totalTicks = intervals + 1;
  const step = availableWidth / intervals;

  // Single-metric mode
  const clampedTotal = Math.max(0, total);
  const clampedChecked = Math.max(0, Math.min(clampedTotal, checked));
  const remaining = Math.max(0, clampedTotal - clampedChecked);
  const singlePct = clampedTotal > 0 ? (clampedChecked / clampedTotal) * 100 : 0;

  // Multi-segment mode
  const totalSegmentsValue = useMemo(() => {
    if (!hasSegments || !segments) return 0;
    return segments.reduce((sum, s) => sum + Math.max(0, s.value), 0);
  }, [hasSegments, segments]);

  // Largest-remainder split of the sticks between segments; every positive
  // segment keeps at least one stick when there are enough to go round.
  const tickToSegmentIndex = useMemo(() => {
    if (!hasSegments || !segments || totalSegmentsValue <= 0) return [];
    const rawCounts = segments.map((s) => (Math.max(0, s.value) / totalSegmentsValue) * totalTicks);
    const floorCounts = rawCounts.map((rc, idx) => ({
      idx,
      count: Math.floor(rc),
      remainder: rc - Math.floor(rc),
      positive: (segments[idx]?.value ?? 0) > 0,
    }));
    const positiveCount = floorCounts.filter((f) => f.positive).length;
    if (totalTicks >= positiveCount) {
      floorCounts.forEach((f) => {
        if (f.positive && f.count === 0) f.count = 1;
      });
    }
    const sumAssigned = floorCounts.reduce((acc, f) => acc + f.count, 0);
    if (sumAssigned > totalTicks) {
      const sorted = [...floorCounts].sort((a, b) => b.count - a.count);
      let excess = sumAssigned - totalTicks;
      for (const item of sorted) {
        if (excess <= 0) break;
        if (item.count > 1) {
          const drop = Math.min(excess, item.count - 1);
          item.count -= drop;
          excess -= drop;
        }
      }
    } else if (sumAssigned < totalTicks) {
      const sorted = [...floorCounts].sort((a, b) => b.remainder - a.remainder);
      let diff = totalTicks - sumAssigned;
      for (const item of sorted) {
        if (diff <= 0) break;
        item.count += 1;
        diff -= 1;
      }
    }

    const mapping: number[] = [];
    floorCounts.forEach((f) => {
      for (let k = 0; k < f.count; k++) mapping.push(f.idx);
    });
    while (mapping.length < totalTicks) {
      mapping.push(Math.max(0, segments.length - 1));
    }
    return mapping;
  }, [hasSegments, segments, totalSegmentsValue, totalTicks]);

  const targetTicksCount = useMemo(() => {
    if (hasSegments) return totalTicks;
    if (clampedTotal === 0 || clampedChecked === 0) return 0;
    if (clampedChecked >= clampedTotal) return totalTicks;
    return Math.max(1, Math.min(totalTicks, Math.round((clampedChecked / clampedTotal) * totalTicks)));
  }, [hasSegments, clampedChecked, clampedTotal, totalTicks]);

  // Sticks grow in one after another; reduced motion jumps to the target.
  useEffect(() => {
    if (!hasEnteredView) return;

    const currentVal = progressMotion.get();
    const delta = Math.abs(targetTicksCount - currentVal);
    const duration = reduceMotion
      ? 0
      : Math.min(1.3, Math.max(0.6, (delta / Math.max(1, totalTicks)) * 2.0 + 0.5));

    const controls = animate(progressMotion, targetTicksCount, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplayProgress(latest),
    });

    return () => controls.stop();
  }, [targetTicksCount, totalTicks, hasEnteredView, progressMotion, reduceMotion]);

  const ticks = useMemo(() => {
    const list = [];
    const y1 = 3;
    const y2 = 3 + stickHeight;
    for (let i = 0; i < totalTicks; i++) {
      list.push({
        index: i,
        x: stickWidth / 2 + i * step,
        y1,
        y2,
        isTargetActive: i < targetTicksCount,
      });
    }
    return list;
  }, [totalTicks, stickWidth, step, stickHeight, targetTicksCount]);

  // Gradient for the active sticks (single-metric mode only). Each active
  // stick takes the solid mixed colour at its own position along the stops,
  // so the row reads as a discrete colour flow. Deliberately per stick rather
  // than an SVG linearGradient reference: a `url(#…)` paint server that fails
  // to resolve paints as transparent, which reads as an empty gauge.
  const gradientStops =
    !hasSegments && activeGradient && activeGradient.length >= 2 ? activeGradient : null;
  const gradientCss = gradientStops
    ? `linear-gradient(90deg, ${gradientStops.join(", ")})`
    : null;

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const node = containerRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;

    if (hasSegments && segments && segments.length > 0) {
      const tickIndex = Math.max(
        0,
        Math.min(totalTicks - 1, Math.round((relativeX - stickWidth / 2) / step)),
      );
      const segIndex = tickToSegmentIndex[tickIndex] ?? 0;
      const seg = segments[segIndex];
      if (seg) {
        setHoverState({
          x: relativeX,
          segmentIndex: segIndex,
          segmentLabel: seg.label,
          segmentValue: seg.value,
          segmentPct: totalSegmentsValue > 0 ? (seg.value / totalSegmentsValue) * 100 : 0,
          segmentColor: seg.color,
        });
      }
      return;
    }

    // Two-part mode (checked / remaining)
    const splitX = stickWidth / 2 + (targetTicksCount - 0.5) * step;
    const isChecked = relativeX <= splitX && targetTicksCount > 0;
    setHoverState({
      x: relativeX,
      segmentIndex: isChecked ? 0 : 1,
      segmentLabel: isChecked ? checkedLabel : remainingLabel,
      segmentValue: isChecked ? clampedChecked : remaining,
      segmentPct: isChecked ? singlePct : 100 - singlePct,
      segmentColor: isChecked
        ? (gradientCss ?? activeColor)
        : hoverInactiveColor !== DEFAULT_HOVER_INACTIVE
          ? hoverInactiveColor
          : inactiveColor,
    });
  };

  const isHovered = hoverState !== null;
  const hoveredSegmentIndex = hoverState?.segmentIndex ?? null;

  const tooltipX = useMemo(() => {
    if (!hoverState) return 0;
    const minPadding = Math.min(85, effectiveWidth / 2);
    return Math.max(minPadding, Math.min(effectiveWidth - minPadding, hoverState.x));
  }, [hoverState, effectiveWidth]);

  const svgHeight = stickHeight + 6;
  const stickTransition = reduceMotion
    ? undefined
    : "transition-[stroke,stroke-width,opacity] duration-150";

  const ariaValueNow = Math.round(hasSegments ? 100 : singlePct);
  const defaultAriaValueText = hasSegments
    ? segments?.map((s) => `${s.label}: ${valueFormatter(s.value)}`).join(", ")
    : `${valueFormatter(clampedChecked)} of ${valueFormatter(clampedTotal)} (${singlePct.toFixed(1)}%)`;

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setHoverState(null)}
      className={cn("relative w-full select-none", className)}
      role="progressbar"
      aria-valuenow={ariaValueNow}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
      aria-valuetext={ariaValueText ?? defaultAriaValueText}
    >
      <svg
        className="block w-full overflow-visible"
        height={svgHeight}
        style={{ height: svgHeight }}
        aria-hidden="true"
      >
        {hasSegments && segments ? (
          ticks.map((tick) => {
            const segIdx = tickToSegmentIndex[tick.index] ?? 0;
            const seg = segments[segIdx];
            if (!seg) return null;

            const isThisSegHovered = hoveredSegmentIndex === segIdx;
            const baseStroke = seg.ramp?.length
              ? rampStroke(seg.ramp, tick.index / Math.max(1, totalTicks - 1))
              : seg.color;
            const stroke = isThisSegHovered && seg.hoverColor ? seg.hoverColor : baseStroke;
            const strokeW = isThisSegHovered ? stickWidth + 0.5 : stickWidth;
            const opacity = isHovered ? (isThisSegHovered ? 1 : 0.3) : 1;

            const fill = Math.min(1, Math.max(0, displayProgress - tick.index));
            if (fill <= 0) return null;
            const activeY2 = tick.y1 + Math.max(0.1, stickHeight * fill);

            return (
              <line
                key={`seg-tick-${compId}-${tick.index}`}
                x1={tick.x}
                y1={tick.y1}
                x2={tick.x}
                y2={activeY2}
                style={{ stroke }}
                strokeWidth={strokeW}
                strokeLinecap="round"
                opacity={opacity}
                className={stickTransition}
              />
            );
          })
        ) : (
          <>
            {/* Layer 1: the track */}
            {ticks.map((tick) => {
              let baseStroke = tick.isTargetActive ? "var(--rule-soft)" : inactiveColor;
              let opacity = hasEnteredView ? 1 : 0;
              let strokeW = stickWidth;

              if (isHovered) {
                if (hoveredSegmentIndex === 1 && !tick.isTargetActive) {
                  baseStroke = hoverInactiveColor;
                  strokeW = stickWidth + 0.5;
                  opacity = 1;
                } else if (hoveredSegmentIndex === 0 && !tick.isTargetActive) {
                  opacity = 0.25;
                }
              }

              return (
                <line
                  key={`base-tick-${compId}-${tick.index}`}
                  x1={tick.x}
                  y1={tick.y1}
                  x2={tick.x}
                  y2={tick.y2}
                  style={{ stroke: baseStroke }}
                  strokeWidth={strokeW}
                  strokeLinecap="round"
                  opacity={opacity}
                  className={stickTransition}
                />
              );
            })}

            {/* Layer 2: the active sticks */}
            {ticks.map((tick) => {
              const fill = Math.min(1, Math.max(0, displayProgress - tick.index));
              if (fill <= 0) return null;

              const activeStroke = gradientStops
                ? sampleGradient(
                    gradientStops,
                    targetTicksCount > 1 ? tick.index / (targetTicksCount - 1) : 0,
                  )
                : activeColor;
              let strokeW = stickWidth;
              let activeOpacity = Math.min(1, fill * 1.5);

              if (isHovered) {
                if (hoveredSegmentIndex === 0 && tick.isTargetActive) {
                  strokeW = stickWidth + 0.5;
                  activeOpacity = 1;
                } else if (hoveredSegmentIndex === 1 && tick.isTargetActive) {
                  activeOpacity = 0.25;
                }
              }

              const activeY2 = tick.y1 + Math.max(0.1, stickHeight * fill);

              return (
                <line
                  key={`active-tick-${compId}-${tick.index}`}
                  x1={tick.x}
                  y1={tick.y1}
                  x2={tick.x}
                  y2={activeY2}
                  style={{ stroke: activeStroke }}
                  strokeWidth={strokeW}
                  strokeLinecap="round"
                  opacity={activeOpacity}
                  className={stickTransition}
                />
              );
            })}
          </>
        )}
      </svg>

      <AnimatePresence>
        {showTooltip && hoverState && (
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 3 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 3 }}
            transition={{ duration: reduceMotion ? 0 : 0.15, ease: "easeOut" }}
            style={{ left: tooltipX }}
            className="pointer-events-none absolute -top-10 z-50 -translate-x-1/2 whitespace-nowrap rounded-inset border border-on-solid/10 bg-ink px-2.5 py-1 font-body text-[11px] font-medium text-on-solid shadow-lg"
          >
            <div className="flex items-center gap-1.5">
              <span
                className="size-1.5 shrink-0 rounded-full"
                style={{ background: hoverState.segmentColor }}
              />
              <span className="font-semibold text-on-solid">{hoverState.segmentLabel}</span>
              <span className="font-mono tabular-nums text-on-solid/70">
                {valueFormatter(hoverState.segmentValue)} ({hoverState.segmentPct.toFixed(1)}%)
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
