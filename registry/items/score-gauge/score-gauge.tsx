"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from "react";
import {
  animate,
  AnimatePresence,
  motion,
  useInView,
  useReducedMotionConfig,
} from "motion/react";

import { cn } from "@/lib/utils";

/**
 * A 0–1 score as an instrument gauge.
 *
 * **The whole scale is always drawn.** A 250° sweep opening at the bottom —
 * zero at seven o'clock, one at five o'clock — so the arc is the territory and
 * the needle is the reading. The arc is a comb of radial bars in one
 * continuous stop → orange → yellow → go gradient, divided into zones.
 *
 * Two sizes of the same instrument, read off the same geometry and the same
 * ramp so a score sits in the same zone, in the same colour, at either size:
 *
 * - `full`: 60 bars, scale numbers, a readout table, and a hover / tap
 *   explainer per zone. For the one place someone interrogates the number.
 * - `mini`: 24 fatter bars, no numbers, no hover, a two-line readout. For a
 *   card in a list, where six interactive dials would be noise.
 *
 * Both swing the needle in on a slow spring the first time the dial scrolls
 * into view, and land on the reading with no sweep under reduced motion.
 */

/* ------------------------------------------------------------------------ */
/* Zones                                                                    */
/* ------------------------------------------------------------------------ */

export type ScoreGaugeTone = "stop" | "hold" | "go";

export type ScoreGaugeZone = {
  /** Stable key. */
  id: string;
  /** The band's name, as the readout prints it ("High"). */
  label: string;
  /** Where the zone starts on the 0–1 scale (inclusive). */
  from: number;
  /** Where it ends (exclusive, except the last zone, which owns 1). */
  to: number;
  /** Ink for the band's name in the readout. Defaults from the zone's midpoint. */
  tone?: ScoreGaugeTone;
  /** What landing in this zone means, in the reader's terms. Shown on hover. */
  description?: string;
  /** A second, quieter line: how a score usually gets here. */
  detail?: string;
};

/**
 * Six tiers, cut so that with 60 bars every threshold falls exactly on a gap
 * between two bars.
 */
export const DEFAULT_PRIORITY_ZONES: ScoreGaugeZone[] = [
  { id: "critical_low", label: "Critical Low", from: 0, to: 0.2 },
  { id: "low", label: "Low", from: 0.2, to: 0.4 },
  { id: "low_medium", label: "Low Medium", from: 0.4, to: 0.55 },
  { id: "high_medium", label: "High Medium", from: 0.55, to: 0.7 },
  { id: "high", label: "High", from: 0.7, to: 0.85 },
  { id: "extremely_high", label: "Extremely High", from: 0.85, to: 1 },
];

function zoneOf(
  zones: ScoreGaugeZone[],
  fraction: number,
): ScoreGaugeZone | null {
  const last = zones[zones.length - 1];
  for (const zone of zones) {
    if (fraction >= zone.from && fraction < zone.to) return zone;
  }
  return last && fraction >= last.to ? last : null;
}

function toneOf(zone: ScoreGaugeZone): ScoreGaugeTone {
  if (zone.tone) return zone.tone;
  const mid = (zone.from + zone.to) / 2;
  if (mid < 0.4) return "stop";
  if (mid < 0.7) return "hold";
  return "go";
}

const TONE_TEXT: Record<ScoreGaugeTone, string> = {
  stop: "text-stop",
  hold: "text-hold",
  go: "text-go",
};

const fmt = (n: number) => (n === 0 ? "0" : n.toFixed(2));

function rangeOf(zone: ScoreGaugeZone): string {
  if (zone.from <= 0) return `under ${fmt(zone.to)}`;
  if (zone.to >= 1) return `${fmt(zone.from)} and up`;
  return `${fmt(zone.from)} to ${fmt(zone.to)}`;
}

/* ------------------------------------------------------------------------ */
/* The ramp                                                                 */
/* ------------------------------------------------------------------------ */

/**
 * Gradient stops behind the comb. Every stop is a contract token (or a mix of
 * two), so the ramp follows the theme and the mode with no JavaScript. The
 * two ends are pushed a step deeper than the state tokens by mixing toward a
 * neighbour, which keeps the original's brick → amber → forest character.
 */
const RAMP: readonly { at: number; colour: string }[] = [
  { at: 0, colour: "var(--stop)" },
  { at: 0.2, colour: "color-mix(in oklab, var(--stop) 45%, var(--ramp-orange))" },
  { at: 0.4, colour: "var(--ramp-orange)" },
  { at: 0.55, colour: "var(--milestone-yellow)" },
  { at: 0.7, colour: "color-mix(in oklab, var(--go-pale) 40%, var(--go))" },
  { at: 0.85, colour: "var(--go)" },
  { at: 1, colour: "color-mix(in oklab, var(--go) 78%, var(--ink))" },
];

/** The ramp at `fraction`, as a CSS colour. Pass it through `style`. */
function rampColour(fraction: number): string {
  const f = clamp01(fraction);
  let lower = RAMP[0];
  let upper = RAMP[RAMP.length - 1];
  for (let i = 0; i < RAMP.length - 1; i += 1) {
    if (f >= RAMP[i].at && f <= RAMP[i + 1].at) {
      lower = RAMP[i];
      upper = RAMP[i + 1];
      break;
    }
  }
  const span = upper.at - lower.at;
  const t = span <= 0 ? 0 : (f - lower.at) / span;
  const lowerShare = Math.round((1 - t) * 1000) / 10;
  return `color-mix(in oklab, ${lower.colour} ${lowerShare}%, ${upper.colour})`;
}

/* ------------------------------------------------------------------------ */
/* Geometry                                                                 */
/* ------------------------------------------------------------------------ */

const START_ANGLE_DEG = 145;
const SWEEP_DEG = 250;
const CX = 100;
const CY = 100;

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const round = (n: number) => Math.round(n * 1000) / 1000;

function angleAt(fraction: number): number {
  return ((START_ANGLE_DEG + fraction * SWEEP_DEG) * Math.PI) / 180;
}

function pointAt(fraction: number, radius: number): { x: number; y: number } {
  const angle = angleAt(fraction);
  return {
    x: round(CX + radius * Math.cos(angle)),
    y: round(CY + radius * Math.sin(angle)),
  };
}

type Geometry = {
  ticks: number;
  tickInner: number;
  tickOuter: number;
  tickWidth: number;
  needleTip: number;
  needleTail: number;
  needleHalfWidth: number;
};

const GEOMETRY: Record<"full" | "mini", Geometry> = {
  full: {
    ticks: 60,
    tickInner: 72,
    tickOuter: 94,
    tickWidth: 3.4,
    needleTip: 62,
    needleTail: 15,
    needleHalfWidth: 4,
  },
  mini: {
    ticks: 24,
    tickInner: 74,
    tickOuter: 94,
    tickWidth: 5.2,
    needleTip: 62,
    needleTail: 13,
    needleHalfWidth: 5,
  },
};

/** Scale labels sit just outside the comb. */
const R_LABEL = 107;

function buildTicks(geometry: Geometry) {
  return Array.from({ length: geometry.ticks }, (_, index) => {
    const centre = (index + 0.5) / geometry.ticks;
    const base = pointAt(centre, geometry.tickInner);
    const tip = pointAt(centre, geometry.tickOuter);
    return {
      index,
      centre,
      colour: rampColour(centre),
      x1: base.x,
      y1: base.y,
      x2: tip.x,
      y2: tip.y,
    };
  });
}

const FULL_TICKS = buildTicks(GEOMETRY.full);
const MINI_TICKS = buildTicks(GEOMETRY.mini);

/** The needle as a tapered wedge from behind the hub to short of the comb. */
function needlePoints(fraction: number, geometry: Geometry): string {
  const angle = angleAt(fraction);
  const px = -Math.sin(angle) * geometry.needleHalfWidth;
  const py = Math.cos(angle) * geometry.needleHalfWidth;
  const tip = pointAt(fraction, geometry.needleTip);
  const tail = pointAt(fraction, -geometry.needleTail);
  return [
    `${round(tail.x + px)},${round(tail.y + py)}`,
    `${round(tip.x)},${round(tip.y)}`,
    `${round(tail.x - px)},${round(tail.y - py)}`,
  ].join(" ");
}

/** An arc along the scale, as a stroke-able path. Used for the hover targets. */
function arcPath(from: number, to: number, radius: number): string {
  const start = pointAt(from, radius);
  const end = pointAt(to, radius);
  const largeArc = (to - from) * SWEEP_DEG > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

/** Which side of the dial a label hangs off, so text never sits on the arc. */
function labelAnchor(fraction: number): "start" | "middle" | "end" {
  const cos = Math.cos(angleAt(fraction));
  if (cos < -0.25) return "end";
  if (cos > 0.25) return "start";
  return "middle";
}

/* ------------------------------------------------------------------------ */
/* Motion                                                                   */
/* ------------------------------------------------------------------------ */

/**
 * The needle's entrance: at rest on zero until the dial is first seen, then a
 * slow spring carries it to the reading — the way a physical needle swings
 * over and settles, with a whisper of overshoot. Duration-based, so timing is
 * the same whatever the score. A later change of value swings from wherever
 * the needle is. Reduced motion gets the reading with no sweep at all.
 */
function useNeedleSweep(
  target: number | null,
  ref: RefObject<Element | null>,
): number | null {
  const reduceMotion = useReducedMotionConfig();
  const inView = useInView(ref, { once: true, amount: 0.35 });
  const [swept, setSwept] = useState(0);
  const current = useRef(0);

  useEffect(() => {
    if (target === null || reduceMotion || !inView) return;
    const controls = animate(current.current, target, {
      type: "spring",
      duration: 1.8,
      bounce: 0.12,
      onUpdate: (value) => {
        current.current = value;
        setSwept(value);
      },
      onComplete: () => {
        current.current = target;
        setSwept(target);
      },
    });
    return () => controls.stop();
  }, [target, inView, reduceMotion]);

  if (target === null) return null;
  if (reduceMotion) return target;
  // The spring may breathe a hair past either end; the dial draws 0–1 only.
  return clamp01(swept);
}

/* ------------------------------------------------------------------------ */
/* Tooltip placement                                                        */
/* ------------------------------------------------------------------------ */

const TOOLTIP_W = 220;
const TOOLTIP_H = 200;

type TooltipPlacement = { style: CSSProperties; arrowStyle: CSSProperties };

/**
 * Beside the gauge rather than over it: left if there is room, else right,
 * else (on a phone) below.
 */
function placeTooltip(
  cursor: { x: number; y: number } | null,
  rect: DOMRect | null,
  span: { from: number; to: number },
): TooltipPlacement {
  let cy = cursor?.y ?? 80;
  if (!cursor) {
    const pt = pointAt((span.from + span.to) / 2, R_HIT);
    const scale = ((rect?.width ?? 250) * (188 / 260)) / 188;
    cy = (pt.y + 12) * scale;
  }

  const spaceLeft = rect ? rect.left : 400;
  const spaceRight =
    rect && typeof window !== "undefined" ? window.innerWidth - rect.right : 200;

  const top = Math.max(0, Math.min(80, cy - 60));
  const arrowTop = Math.max(16, Math.min(TOOLTIP_H - 16, cy - top));

  if (spaceLeft >= TOOLTIP_W + 16) {
    return {
      style: { right: "calc(100% + 14px)", top },
      arrowStyle: { right: -5, top: arrowTop, transform: "translateY(-50%) rotate(45deg)" },
    };
  }
  if (spaceRight >= TOOLTIP_W + 16) {
    return {
      style: { left: "calc(100% + 14px)", top },
      arrowStyle: { left: -5, top: arrowTop, transform: "translateY(-50%) rotate(45deg)" },
    };
  }
  const arrowLeft = Math.max(16, Math.min(TOOLTIP_W - 16, cursor?.x ?? 110));
  return {
    style: { top: "calc(100% + 12px)", left: "50%", transform: "translateX(-50%)" },
    arrowStyle: { top: -5, left: arrowLeft, transform: "translateX(-50%) rotate(45deg)" },
  };
}

/** The hover target: one fat transparent arc per zone, swallowing the comb. */
const R_HIT = (GEOMETRY.full.tickInner + GEOMETRY.full.tickOuter) / 2;
const HIT_WIDTH = GEOMETRY.full.tickOuter - GEOMETRY.full.tickInner + 8;

/* ------------------------------------------------------------------------ */
/* Component                                                                */
/* ------------------------------------------------------------------------ */

export type ScoreGaugeReadout = { label: string; value: ReactNode };

export type ScoreGaugeProps = {
  /** The score, 0–1. `null` draws the scale faded with no needle. */
  value: number | null;
  /** `full` for a record header, `mini` for a card in a list. */
  size?: "full" | "mini";
  /** What the score is called, in the readout and for screen readers. */
  label?: string;
  /** The bands. Defaults to six tiers at 0.20 / 0.40 / 0.55 / 0.70 / 0.85. */
  zones?: ScoreGaugeZone[];
  /** Extra rows under the band in the full readout ("Parameters: 3 of 5"). */
  readouts?: ScoreGaugeReadout[];
  /** One closing line in every zone explainer. Full size only. */
  footnote?: string;
  /** What to print with no score. */
  emptyLabel?: string;
  /** A zone was pinned (tap / Enter) or unpinned (`null`). Full size only. */
  onZoneSelect?: (zoneId: string | null) => void;
  className?: string;
};

export function ScoreGauge({ size = "full", ...props }: ScoreGaugeProps) {
  return size === "mini" ? <MiniDial {...props} /> : <FullDial {...props} />;
}

type InnerProps = Omit<ScoreGaugeProps, "size">;

function Hub({ shown, children }: { shown: boolean; children?: ReactNode }) {
  return shown ? (
    <g className="text-ink">
      {children}
      <circle cx={CX} cy={CY} r={11} className="fill-paper-sunk" />
      <circle cx={CX} cy={CY} r={6} fill="currentColor" />
    </g>
  ) : (
    <circle cx={CX} cy={CY} r={9} className="fill-paper-sunk" />
  );
}

function FullDial({
  value,
  label = "Priority",
  zones = DEFAULT_PRIORITY_ZONES,
  readouts,
  footnote,
  emptyLabel = "Not scored yet",
  onZoneSelect,
  className,
}: InnerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  // Pinning makes the explanation reachable on a touch screen.
  const [pinnedZone, setPinnedZone] = useState<string | null>(null);

  const clamped = value === null ? null : clamp01(value);
  const shown = useNeedleSweep(clamped, containerRef);
  const zone = shown === null ? null : zoneOf(zones, shown);
  const finalZone = clamped === null ? null : zoneOf(zones, clamped);

  const scaleMarks = useMemo(() => {
    const cuts = new Set<number>([0, 1]);
    for (const z of zones) cuts.add(z.from);
    return [...cuts].sort((a, b) => a - b);
  }, [zones]);

  const activeId = hoveredZone ?? pinnedZone;
  const activeZone = activeId === null ? null : (zones.find((z) => z.id === activeId) ?? null);
  const placement = activeZone ? placeTooltip(cursor, rect, activeZone) : null;

  const togglePin = (id: string) => {
    const next = pinnedZone === id ? null : id;
    setPinnedZone(next);
    onZoneSelect?.(next);
  };

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const box = containerRef.current.getBoundingClientRect();
    setRect(box);
    setCursor({ x: event.clientX - box.left, y: event.clientY - box.top });
  };

  const srExtras = (readouts ?? [])
    .map((r) => (typeof r.value === "string" || typeof r.value === "number" ? `, ${r.label} ${r.value}` : ""))
    .join("");

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={cn(
        "relative flex min-h-0 w-[210px] max-w-full shrink-0 flex-col items-center sm:w-[230px] md:w-[250px] lg:w-[275px] xl:w-[290px]",
        className,
      )}
    >
      <p className="sr-only">
        {clamped === null
          ? `${label}: ${emptyLabel.toLowerCase()}.`
          : `${label} ${clamped.toFixed(2)} out of 1.00${
              finalZone ? `, ${finalZone.label.toLowerCase()}` : ""
            }${srExtras}.`}
      </p>
      <div
        role="group"
        aria-label={`${label} scale. Each zone explains what landing in it means.`}
        className="w-full"
      >
        <svg viewBox="-30 -12 260 188" className="block h-auto w-full select-none">
          <g
            strokeWidth={GEOMETRY.full.tickWidth}
            strokeLinecap="round"
            opacity={clamped === null ? 0.3 : 1}
          >
            {FULL_TICKS.map((tick) => (
              <line
                key={tick.index}
                x1={tick.x1}
                y1={tick.y1}
                x2={tick.x2}
                y2={tick.y2}
                // `style`, not `stroke={…}`: the colour is a CSS `color-mix()`,
                // which a presentation attribute does not parse.
                style={{ stroke: tick.colour }}
                opacity={
                  activeId === null || zoneOf(zones, tick.centre)?.id === activeId ? 1 : 0.22
                }
                className="transition-opacity duration-150"
              />
            ))}
          </g>

          {scaleMarks.map((mark) => {
            const at = pointAt(mark, R_LABEL);
            return (
              <text
                key={mark}
                x={at.x}
                y={at.y + 3.5}
                textAnchor={labelAnchor(mark)}
                fontSize={9.5}
                fontWeight={600}
                className="fill-faint font-body"
              >
                {fmt(mark)}
              </text>
            );
          })}

          <Hub shown={shown !== null}>
            {shown !== null && (
              <polygon points={needlePoints(shown, GEOMETRY.full)} fill="currentColor" />
            )}
          </Hub>

          {zones.map((z) => {
            const words = [z.description, z.detail, footnote].filter(Boolean).join(" ");
            return (
              <path
                key={`hit-${z.id}`}
                d={arcPath(z.from, z.to, R_HIT)}
                fill="none"
                // Paints nothing: it is the hit area, only its width matters.
                stroke="currentColor"
                strokeOpacity={0}
                strokeWidth={HIT_WIDTH}
                strokeLinecap="butt"
                tabIndex={0}
                role="button"
                aria-pressed={pinnedZone === z.id}
                aria-label={`${z.label}, ${rangeOf(z)}.${words ? ` ${words}` : ""}`}
                className="cursor-help outline-none"
                onMouseEnter={() => setHoveredZone(z.id)}
                onMouseLeave={() => setHoveredZone(null)}
                onFocus={() => setHoveredZone(z.id)}
                onBlur={() => setHoveredZone(null)}
                onClick={() => togglePin(z.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    togglePin(z.id);
                  } else if (event.key === "Escape") {
                    setPinnedZone(null);
                    onZoneSelect?.(null);
                  }
                }}
              />
            );
          })}
        </svg>
      </div>

      <dl className="mt-2 w-full px-1">
        <div className="flex items-baseline justify-between gap-3 border-b border-rule-soft pb-1.5">
          <dt className="font-body text-[11px] font-bold tracking-[0.04em] text-dim uppercase lg:text-[12px]">
            {label}
          </dt>
          <dd className="font-body text-[22px] leading-none font-semibold tracking-[-0.03em] text-ink tabular-nums lg:text-[25px]">
            {shown === null ? "—" : shown.toFixed(2)}
          </dd>
        </div>

        <div
          className={cn(
            "flex items-baseline justify-between gap-3 py-1.5",
            readouts?.length ? "border-b border-rule-soft" : null,
          )}
        >
          <dt className="font-body text-[12px] font-medium text-faint lg:text-[12.5px]">Band</dt>
          <dd
            className={cn(
              "font-body text-[12.5px] font-semibold tracking-[-0.01em] lg:text-[13.5px]",
              zone ? TONE_TEXT[toneOf(zone)] : "text-faint",
            )}
          >
            {clamped === null ? emptyLabel : (zone?.label ?? "—")}
          </dd>
        </div>

        {readouts?.map((row, index) => (
          <div
            key={row.label}
            className={cn(
              "flex items-baseline justify-between gap-3 pt-1.5",
              index < readouts.length - 1 ? "border-b border-rule-soft pb-1.5" : null,
            )}
          >
            <dt className="font-body text-[12px] font-medium text-faint lg:text-[12.5px]">
              {row.label}
            </dt>
            <dd className="font-body text-[12.5px] font-semibold text-dim tabular-nums lg:text-[13px]">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>

      {/* The zone explainer, beside the gauge rather than over it. */}
      <AnimatePresence>
        {activeZone && placement && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            aria-hidden="true"
            className="pointer-events-none absolute z-50 w-[220px] rounded-inset border border-on-solid/10 bg-ink p-3 font-body shadow-[0_12px_32px_color-mix(in_oklab,var(--ink)_40%,transparent)]"
            style={placement.style}
          >
            <div className="flex items-baseline justify-between gap-1.5 border-b border-on-solid/10 pb-2">
              <div className="flex min-w-0 items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: rampColour((activeZone.from + activeZone.to) / 2) }}
                />
                <span className="truncate text-[12px] font-semibold tracking-[-0.01em] text-on-solid">
                  {activeZone.label}
                </span>
              </div>
              <span className="shrink-0 text-[10.5px] font-medium text-on-solid/50 tabular-nums">
                {rangeOf(activeZone)}
              </span>
            </div>

            {activeZone.description && (
              <p className="mt-2 text-[11.5px] leading-[1.5] text-on-solid/80">
                {activeZone.description}
              </p>
            )}

            {activeZone.detail && (
              <p className="mt-2 border-t border-on-solid/10 pt-1.5 text-[11px] leading-[1.4] text-on-solid/60">
                {activeZone.detail}
              </p>
            )}

            {footnote && (
              <p className="mt-1.5 text-[10.5px] leading-[1.35] font-medium text-on-solid/40">
                {footnote}
              </p>
            )}

            <div
              aria-hidden="true"
              className="absolute z-50 size-2.5 rounded-[2px] bg-primary"
              style={placement.arrowStyle}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MiniDial({
  value,
  label = "Priority",
  zones = DEFAULT_PRIORITY_ZONES,
  emptyLabel = "Not scored yet",
  className,
}: InnerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const clamped = value === null ? null : clamp01(value);
  const shown = useNeedleSweep(clamped, ref);
  const zone = shown === null ? null : zoneOf(zones, shown);
  const finalZone = clamped === null ? null : zoneOf(zones, clamped);

  return (
    <span
      ref={ref}
      role="img"
      aria-label={
        clamped === null
          ? emptyLabel
          : `${label} ${clamped.toFixed(1)} out of 1${
              finalZone ? `, ${finalZone.label.toLowerCase()}` : ""
            }`
      }
      className={cn("flex shrink-0 flex-col items-center", className)}
    >
      <svg viewBox="2 2 196 160" aria-hidden="true" className="block h-auto w-[78px] select-none">
        <g
          strokeWidth={GEOMETRY.mini.tickWidth}
          strokeLinecap="round"
          opacity={clamped === null ? 0.3 : 1}
        >
          {MINI_TICKS.map((tick) => (
            <line
              key={tick.index}
              x1={tick.x1}
              y1={tick.y1}
              x2={tick.x2}
              y2={tick.y2}
              style={{ stroke: tick.colour }}
            />
          ))}
        </g>
        <Hub shown={shown !== null}>
          {shown !== null && (
            <polygon points={needlePoints(shown, GEOMETRY.mini)} fill="currentColor" />
          )}
        </Hub>
      </svg>

      <span className="mt-0.5 block font-body text-[19px] leading-none font-bold tracking-[-0.02em] text-ink tabular-nums">
        {shown === null ? "—" : shown.toFixed(1)}
        <span className="ml-0.5 text-[10px] font-semibold text-faint">/1</span>
      </span>
      <span
        className={cn(
          "mt-1 block text-center font-body text-[10px] leading-[1.2] font-bold tracking-[0.02em]",
          zone ? TONE_TEXT[toneOf(zone)] : "text-faint",
        )}
      >
        {zone?.label ?? emptyLabel}
      </span>
    </span>
  );
}

export default ScoreGauge;
