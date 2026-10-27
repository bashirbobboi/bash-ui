"use client";

import { type CSSProperties, useEffect, useId, useMemo, useRef, useState } from "react";

import { formatCompactGbp, formatGbp } from "./fund-flow-format";
import type { FlowBand, FundFlow } from "./fund-flow-types";
import { useReducedMotionConfig } from "motion/react";
import { Liquid } from "liquid-gooey";
import { InfoTooltip } from "../info-tooltip/info-tooltip";
import { BELOW_MD_QUERY, useMediaQuery } from "./fund-flow-media";
import { formatUkDate } from "./fund-flow-format";

const PLATE = "var(--ff-plate)";
const PLATE_EDGE = "var(--ff-plate-edge)";
const FF_INK = "var(--ff-ink)";
const FF_DIM = "var(--ff-dim)";
const FF_FAINT = "var(--ff-faint)";
const FF_RULE = "var(--ff-rule)";

const IN_RAMP = [
  "var(--ff-in-0)",
  "var(--ff-in-1)",
  "var(--ff-in-2)",
  "var(--ff-in-3)",
  "var(--ff-in-4)",
  "var(--ff-in-5)",
];
const OUT_RAMP = [
  "var(--ff-out-0)",
  "var(--ff-out-1)",
  "var(--ff-out-2)",
  "var(--ff-out-3)",
  "var(--ff-out-4)",
  "var(--ff-out-5)",
];

const RESIDUAL_FILL = "var(--ff-residual)";

const HUB_FILL = IN_RAMP[0];

const VIEW_W = 900;
const VIEW_H = 505;
const PAD = 16;

const TRIO_Y = 27;

const HEAD_Y = 60;
const LEGEND_Y = 78;
const SWATCH_Y = 82;
const SWATCH_H = 7;
const SWATCH_W = 22;
const SWATCH_GAP = 2;

const PLOT_TOP = 104;
const PLOT_BOTTOM = VIEW_H - 25;
const PLOT_H = PLOT_BOTTOM - PLOT_TOP;

const NODE_W = 10;

const COL_L_X = 238;
const COL_R_X = VIEW_W - 238 - NODE_W;
const HUB_X = VIEW_W / 2 - NODE_W / 2;
const TEXT_L = PAD;
const TEXT_R = VIEW_W - PAD;

const ELBOW = 26;

const CROP_X = COL_L_X - 2;
const CROP_W = COL_R_X + NODE_W + 2 - CROP_X;
const CROP_Y = PLOT_TOP - 4;
const CROP_H = PLOT_H + 8;

const YEAR_TAB_WIDTH = 58;

const FEATHER = 70;

const POUR_IN_FROM = COL_L_X;
const POUR_IN_SPAN = HUB_X + NODE_W - COL_L_X;
const POUR_OUT_FROM = HUB_X;
const POUR_OUT_SPAN = COL_R_X + NODE_W - HUB_X;

const GAP_L = 10;
const GAP_R = 16;

const LABEL_PITCH = 28;

const MIN_BAND_H = 1.4;

type Placed = {
  band: FlowBand;
  y: number;
  height: number;
  hubY: number;
  hubHeight: number;
  share: number;
  shade: string;
  
  labelY: number;
};

function shadeAt(ramp: string[], rank: number, count: number): string {
  if (count <= 1) return ramp[0];
  const step = Math.round((rank * (ramp.length - 1)) / (count - 1));
  return ramp[Math.min(step, ramp.length - 1)];
}

function declash(centres: number[], pitch: number, top: number, bottom: number): number[] {
  const out = [...centres];
  for (let i = 1; i < out.length; i += 1) out[i] = Math.max(out[i], out[i - 1] + pitch);
  for (let i = out.length - 1; i >= 0; i -= 1) {
    const ceiling = i === out.length - 1 ? bottom : out[i + 1] - pitch;
    out[i] = Math.min(out[i], ceiling);
  }
  for (let i = 0; i < out.length; i += 1) {
    const floor = i === 0 ? top : out[i - 1] + pitch;
    out[i] = Math.max(out[i], floor);
  }
  return out;
}

function stack(bands: FlowBand[], total: number, gap: number, ramp: string[]): Placed[] {
  const ordered = [...bands].sort((a, b) => {
    const residual = (band: FlowBand) => (band.kind === "filed" ? 0 : 1);
    return residual(a) - residual(b) || b.amount - a.amount;
  });
  const filedCount = ordered.filter((band) => band.kind === "filed").length;
  const gapAbove = ordered.map((_, index) => (index === 0 ? 0 : gap));
  const gaps = gapAbove.reduce((sum, each) => sum + each, 0);
  const drawable = Math.max(0, PLOT_H - gaps);
  let y = PLOT_TOP;
  let hubY = PLOT_TOP;

  const laid = ordered.map((band, rank) => {
    y += gapAbove[rank];
    const share = total > 0 ? band.amount / total : 0;
    const height = share * drawable;
    const hubHeight = share * PLOT_H;
    const placed: Placed = {
      band,
      y,
      height,
      hubY,
      hubHeight,
      share,
      shade: band.kind === "filed" ? shadeAt(ramp, rank, filedCount) : RESIDUAL_FILL,
      labelY: y + height / 2,
    };
    y += height;
    hubY += hubHeight;
    return placed;
  });

  const centres = declash(
    laid.map((placed) => placed.labelY),
    LABEL_PITCH,
    // Inset so the topmost name clears the column headers and the lowest
    // bracket clears the plot edge.
    PLOT_TOP + 12,
    PLOT_BOTTOM - 14,
  );
  return laid.map((placed, index) => ({ ...placed, labelY: centres[index] }));
}

function share(fraction: number): string {
  const percent = fraction * 100;
  if (percent > 0 && percent < 1) return "<1%";
  return `${Math.round(percent)}%`;
}

function ribbon(
  x0: number,
  x1: number,
  top0: number,
  bottom0: number,
  top1: number,
  bottom1: number,
): string {
  const mid = (x0 + x1) / 2;
  return (
    `M${x0} ${top0} C${mid} ${top0} ${mid} ${top1} ${x1} ${top1} ` +
    `L${x1} ${bottom1} C${mid} ${bottom1} ${mid} ${bottom0} ${x0} ${bottom0} Z`
  );
}

function bracket(
  side: "in" | "out",
  labelY: number,
  bandCentre: number,
): string {
  const ruleY = labelY + 12;
  if (side === "in") {
    const turn = COL_L_X - ELBOW;
    return `M${TEXT_L} ${ruleY} L${turn} ${ruleY} L${COL_L_X} ${bandCentre}`;
  }
  const nodeEdge = COL_R_X + NODE_W;
  const turn = nodeEdge + ELBOW;
  return `M${TEXT_R} ${ruleY} L${turn} ${ruleY} L${nodeEdge} ${bandCentre}`;
}

export type { FundFlow, FlowBand } from "./fund-flow-types";
export type MoneyFlowChartProps = { flows: FundFlow[]; animated?: boolean; showDetails?: boolean };
export function MoneyFlowChart({ flows, animated = true, showDetails = true }: MoneyFlowChartProps) {
  const reducedMotion = useReducedMotionConfig();
  const [yearIndex, setYearIndex] = useState(0);
  const [hovered, setHovered] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const [enteredView, setRevealed] = useState(false);
  const revealed = !animated || reducedMotion || enteredView;
  
  const rawId = useId().replace(/:/g, "");
  const POUR_IN = `${rawId}-pour-in`;
  const POUR_OUT = `${rawId}-pour-out`;
  
  const [replay, setReplay] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const compact = useMediaQuery(BELOW_MD_QUERY);

  // Nothing to draw is a legitimate state, not an error: most charities file a
  // year that cannot be squared, and the caller renders the income panel
  // instead. Guarded here as well so the component is safe on its own terms —
  // an empty list would otherwise index to -1 and read `.inflows` of undefined.
  const flow = flows.length > 0 ? flows[Math.min(yearIndex, flows.length - 1)] : null;

  const inflows = useMemo(
    () => (flow ? stack(flow.inflows, flow.total, GAP_L, IN_RAMP) : []),
    [flow],
  );
  const outflows = useMemo(
    () => (flow ? stack(flow.outflows, flow.total, GAP_R, OUT_RAMP) : []),
    [flow],
  );

  // Scroll into view to play; click anywhere on the figure to replay.
  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      // No observer to wait on, so reveal on the next frame rather than during
      // this effect — a synchronous setState here cascades a second render.
      const frame = requestAnimationFrame(() => setRevealed(true));
      return () => cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // After every hook, so the hook order stays fixed across renders.
  if (!flow) return null;

  const focus = pinned ?? hovered;
  const active =
    [...inflows, ...outflows].find((placed) => placed.band.id === focus) ?? null;

  const bandOpacity = (id: string) => (focus === null || focus === id ? 1 : 0.26);
  const ribbonOpacity = (id: string) =>
    focus === null ? 0.72 : focus === id ? 0.92 : 0.1;
  const labelOpacity = (id: string) => (focus === null || focus === id ? 1 : 0.3);

  const sides = [
    { key: "in" as const, placed: inflows, ramp: IN_RAMP },
    { key: "out" as const, placed: outflows, ramp: OUT_RAMP },
  ];

  const coarseSides = [
    flow.incomeIsTotalOnly ? "what came in" : null,
    flow.spendIsTotalOnly ? "what it paid for" : null,
  ].filter((side): side is string => side !== null);

  const incomeTotal = flow.inflows
    .filter((band) => band.kind === "filed")
    .reduce((sum, band) => sum + band.amount, 0);
  const spendTotal = flow.outflows
    .filter((band) => band.kind === "filed")
    .reduce((sum, band) => sum + band.amount, 0);
  const net = incomeTotal - spendTotal;
  const netFill = net > 0 ? IN_RAMP[0] : net < 0 ? OUT_RAMP[0] : FF_DIM;
  const netTag = net > 0 ? "SURPLUS" : net < 0 ? "DEFICIT" : "BALANCED";

  return (
    <div ref={rootRef} className="fund-flow-plate w-full min-w-0 font-body" data-ff-motion={animated && !reducedMotion ? "on" : "off"}>
      <style>{`
        
        @keyframes ffRise { from { opacity: 0; transform: translateY(11px) } }
        
        @keyframes ffGrowUp { from { transform: scaleY(0) } to { transform: scaleY(1) } }
        
        @keyframes ffPour { to { transform: translateX(var(--ff-travel)) } }
        @keyframes ffSlideIn { from { opacity: 0; transform: translateX(-15px) } }
        @keyframes ffSlideOut { from { opacity: 0; transform: translateX(15px) } }
        @keyframes ffDraw { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }

        .ff-rise { animation: ffRise .6s cubic-bezier(.22,.68,.24,1) both }
        .ff-grow { animation: ffGrowUp .5s cubic-bezier(.22,.68,.24,1) both; transform-box: view-box }
        .ff-pour { animation: ffPour .76s cubic-bezier(.36,.1,.24,1) both; transform-box: view-box }
        .ff-slide-in { animation: ffSlideIn .52s cubic-bezier(.22,.68,.24,1) both }
        .ff-slide-out { animation: ffSlideOut .52s cubic-bezier(.22,.68,.24,1) both }
        .ff-draw { stroke-dasharray: 1; animation: ffDraw .52s cubic-bezier(.22,.68,.24,1) both }

        [data-ff-motion="off"] .ff-rise, [data-ff-motion="off"] .ff-grow,
        [data-ff-motion="off"] .ff-pour, [data-ff-motion="off"] .ff-slide-in,
        [data-ff-motion="off"] .ff-slide-out, [data-ff-motion="off"] .ff-draw { animation: none }
        [data-ff-motion="off"] .ff-draw { stroke-dasharray: none }
        [data-ff-motion="off"] .ff-pour { transform: translateX(var(--ff-travel)) }
        @media (prefers-reduced-motion: reduce) {
          .ff-rise, .ff-grow, .ff-pour,
          .ff-slide-in, .ff-slide-out, .ff-draw { animation: none }
          
          .ff-draw { stroke-dasharray: none }
          .ff-pour { transform: translateX(var(--ff-travel)) }
        }
      `}</style>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h4 className="text-[16.5px] font-medium font-body tracking-[-0.02em] text-ink">
          Spent{" "}
          <span style={{ color: OUT_RAMP[0] }}>
            {formatCompactGbp(spendTotal)}
          </span>{" "}
          against{" "}
          <span className="text-go">
            {formatCompactGbp(incomeTotal)}
          </span>{" "}
          of income,{" "}
          {net < 0 ? (
            <>
              ending the year with a{" "}
              <span className="text-stop">
                {formatCompactGbp(-net)} deficit
              </span>
              .
            </>
          ) : net > 0 ? (
            <>
              ending the year with a{" "}
              <span className="text-go">
                {formatCompactGbp(net)} surplus
              </span>
              .
            </>
          ) : (
            "ending the year balanced."
          )}
        </h4>
        {flows.length > 1 && (
          <Liquid
            blur={5}
            contrast={18}
            fill="var(--ink)"
            shadow="0 2px 6px color-mix(in oklab, var(--ink) 25%, transparent)"
            className="relative inline-flex items-center overflow-x-auto rounded-full border border-rule-soft bg-paper p-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="group"
            aria-label="Filed year"
          >
            <Liquid.Item effect="move" move={{ springiness: 0.6, trail: 0.5, stretch: 0.25 }}>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute top-0.5 bottom-0.5 left-0.5 rounded-full bg-ink transition-transform duration-300 ease-out motion-reduce:transition-none"
                style={{
                  width: `${YEAR_TAB_WIDTH}px`,
                  transform: `translateX(${yearIndex * YEAR_TAB_WIDTH}px)`,
                }}
              />
            </Liquid.Item>

            <div className="relative z-10 flex items-center">
              {flows.map((candidate, index) => (
                <button
                  key={candidate.periodEnd}
                  type="button"
                  onClick={() => {
                    setYearIndex(index);
                    setPinned(null);
                    setReplay((n) => n + 1);
                  }}
                  aria-pressed={index === yearIndex}
                  style={{ width: `${YEAR_TAB_WIDTH}px` }}
                  className={`flex h-7 shrink-0 cursor-pointer items-center justify-center rounded-full font-mono text-[11px] font-semibold tracking-[0.06em] whitespace-nowrap transition-colors duration-200 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink ${
                    index === yearIndex
                      ? "text-on-solid"
                      : "text-faint hover:text-dim"
                  }`}
                >
                  {candidate.label}
                </button>
              ))}
            </div>
          </Liquid>
        )}
      </div>

      <p className="mt-1 text-[13.5px] text-dim">
        Ribbon width = pounds through the year · year ended{" "}
        {formatUkDate(flow.periodEnd)}
      </p>

      <div className="mt-3" onClick={() => setPinned(null)}>
        <div>
          <svg
            key={`${flow.periodEnd}-${replay}`}
            viewBox={
              compact
                ? `${CROP_X} ${CROP_Y} ${CROP_W} ${CROP_H}`
                : `0 0 ${VIEW_W} ${VIEW_H}`
            }
            className="w-full cursor-default"
            role="img"
            aria-label={`Fund flow for ${flow.label}. In: ${flow.inflows
              .map((band) => `${band.label} ${formatGbp(band.amount)}`)
              .join(", ")}. Out: ${flow.outflows
              .map((band) => `${band.label} ${formatGbp(band.amount)}`)
              .join(", ")}.`}
          >
            <rect
              x={0}
              y={0}
              width={VIEW_W}
              height={VIEW_H}
              fill={PLATE}
            />

            <defs>
              {[
                {
                  id: POUR_IN,
                  from: POUR_IN_FROM,
                  span: POUR_IN_SPAN,
                  delay: "0.22s",
                },
                {
                  id: POUR_OUT,
                  from: POUR_OUT_FROM,
                  span: POUR_OUT_SPAN,
                  delay: "0.60s",
                },
              ].map(({ id, from, span, delay }) => {
                // The rect carries its own feather, so it must travel its own
                // width for the solid part to clear the far end.
                const travel = span + FEATHER;
                return (
                  <mask
                    key={id}
                    id={id}
                    maskUnits="userSpaceOnUse" style={{ maskType: "alpha" }}
                    x={0}
                    y={0}
                    width={VIEW_W}
                    height={VIEW_H}
                  >
                    
                    <linearGradient id={`${id}-front`} x1="0" y1="0" x2="1" y2="0">
                      <stop offset={0} stopColor="currentColor" stopOpacity={1} /> 
                      <stop offset={span / travel} stopColor="currentColor" stopOpacity={1} /> 
                      <stop offset={1} stopColor="currentColor" stopOpacity={0} /> 
                    </linearGradient>
                    <rect
                      x={from - travel}
                      y={PLOT_TOP - 8}
                      width={travel}
                      height={PLOT_H + 16}
                      fill={`url(#${id}-front)`}
                      className={revealed ? "ff-pour" : undefined}
                      style={
                        {
                          "--ff-travel": `${travel}px`,
                          animationDelay: delay,
                        } as CSSProperties
                      }
                    />
                  </mask>
                );
              })}
            </defs>

          {!compact && (
            <>
          
          <text
            x={VIEW_W / 2}
            y={TRIO_Y}
            textAnchor="middle"
            
            className={revealed ? "ff-rise" : undefined}
            style={{ animationDelay: "1.0s" }}
            opacity={revealed ? 1 : 0}
          >
            <tspan fontSize={12.5} fontWeight={800} fill={IN_RAMP[0]}>
              {formatCompactGbp(incomeTotal).toUpperCase()}
            </tspan>
            <tspan
              fontSize={7.5}
              fontWeight={700}
              letterSpacing="0.12em"
              fill={FF_DIM}
            >
              {"  IN  "}
            </tspan>
            <tspan fontSize={10} fill={FF_FAINT}>
              {"·"}
            </tspan>
            <tspan fontSize={12.5} fontWeight={800} fill={OUT_RAMP[0]}>
              {`  ${formatCompactGbp(spendTotal).toUpperCase()}`}
            </tspan>
            <tspan
              fontSize={7.5}
              fontWeight={700}
              letterSpacing="0.12em"
              fill={FF_DIM}
            >
              {"  OUT  "}
            </tspan>
            <tspan fontSize={10} fill={FF_FAINT}>
              {"·"}
            </tspan>
            <tspan fontSize={12.5} fontWeight={800} fill={netFill}>
              {`  ${net === 0 ? "" : formatCompactGbp(Math.abs(net)).toUpperCase()}${net === 0 ? "" : " "}${netTag}`}
            </tspan>
          </text>

          <text
            x={TEXT_L}
            y={HEAD_Y}
            fontSize={11}
            fontWeight={800}
            letterSpacing="0.09em"
            fill={FF_INK}
          >
            MONEY IN
          </text>
          <text
            x={TEXT_R}
            y={HEAD_Y}
            textAnchor="end"
            fontSize={11}
            fontWeight={800}
            letterSpacing="0.09em"
            fill={FF_INK}
          >
            MONEY OUT
          </text>

          {sides.map(({ key, ramp, placed }) => {
            // One band carries no rank, so its ramp is a legend for a scale
            // that is not being used. Residual bands sit outside the ramp and
            // do not count towards having one.
            if (placed.filter((entry) => entry.band.kind === "filed").length < 2) return null;
            const width = ramp.length * SWATCH_W + (ramp.length - 1) * SWATCH_GAP;
            const x0 = key === "in" ? TEXT_L : TEXT_R - width;
            const wordProps = {
              fontSize: 6.5,
              fontWeight: 600,
              letterSpacing: "0.12em",
              fill: FF_FAINT,
            } as const;
            return (
              <g key={`legend-${key}`}>
                <text x={x0} y={LEGEND_Y} textAnchor="start" {...wordProps}>
                  SMALLEST
                </text>
                <text
                  x={x0 + width}
                  y={LEGEND_Y}
                  textAnchor="end"
                  {...wordProps}
                >
                  LARGEST
                </text>
                {[...ramp].reverse().map((fill, index) => (
                  <rect
                    key={fill}
                    x={x0 + index * (SWATCH_W + SWATCH_GAP)}
                    y={SWATCH_Y}
                    width={SWATCH_W}
                    height={SWATCH_H}
                    fill={fill}
                  />
                ))}
              </g>
            );
          })}

            </>
          )}

          <g>
            <g mask={`url(#${POUR_IN})`}>
              {inflows.map((placed) => (
                <path
                  key={`in-${placed.band.id}`}
                  d={ribbon(
                    COL_L_X + NODE_W,
                    HUB_X,
                    placed.y,
                    placed.y + Math.max(placed.height, MIN_BAND_H),
                    placed.hubY,
                    placed.hubY + Math.max(placed.hubHeight, MIN_BAND_H),
                  )}
                  fill={placed.shade}
                  opacity={revealed ? ribbonOpacity(placed.band.id) : 0}
                  className="cursor-pointer transition-opacity"
                  onMouseEnter={() => setHovered(placed.band.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={(event) => {
                    event.stopPropagation();
                    setPinned((current) =>
                      current === placed.band.id ? null : placed.band.id,
                    );
                  }}
                >
                  <title>{`${placed.band.label}: ${formatGbp(placed.band.amount)}`}</title>
                </path>
              ))}
            </g>
            <g mask={`url(#${POUR_OUT})`}>
              {outflows.map((placed) => (
                <path
                  key={`out-${placed.band.id}`}
                  d={ribbon(
                    HUB_X + NODE_W,
                    COL_R_X,
                    placed.hubY,
                    placed.hubY + Math.max(placed.hubHeight, MIN_BAND_H),
                    placed.y,
                    placed.y + Math.max(placed.height, MIN_BAND_H),
                  )}
                  fill={placed.shade}
                  opacity={revealed ? ribbonOpacity(placed.band.id) : 0}
                  className="cursor-pointer transition-opacity"
                  onMouseEnter={() => setHovered(placed.band.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={(event) => {
                    event.stopPropagation();
                    setPinned((current) =>
                      current === placed.band.id ? null : placed.band.id,
                    );
                  }}
                >
                  <title>{`${placed.band.label}: ${formatGbp(placed.band.amount)}`}</title>
                </path>
              ))}
            </g>
          </g>

          <rect
            x={HUB_X}
            y={PLOT_TOP}
            width={NODE_W}
            height={PLOT_H}
            fill={HUB_FILL}
            className={revealed ? "ff-grow" : undefined}
            style={{ transformOrigin: `${HUB_X}px ${PLOT_BOTTOM}px` }}
            opacity={revealed ? 1 : 0}
          />

          {sides.map(({ key, placed }) => {
            const x = key === "in" ? COL_L_X : COL_R_X;
            const anchor = key === "in" ? ("start" as const) : ("end" as const);
            const textX = key === "in" ? TEXT_L : TEXT_R;
            // Written per side rather than derived from one margin: the two
            // gutters happen to be the same width today, and a hit target that
            // silently depends on that is a trap for whoever changes one.
            const hitX = key === "in" ? TEXT_L - 6 : COL_R_X;
            const hitW =
              key === "in" ? COL_L_X + NODE_W - TEXT_L + 12 : TEXT_R - COL_R_X + 6;
            
            const beat = key === "in" ? 0.06 : 0.46;
            return placed.map((entry, index) => {
              const centre = entry.y + Math.max(entry.height, MIN_BAND_H) / 2;
              const step = beat + index * 0.04;
              const picked = focus === entry.band.id;
              // Compact has no labels to reach, so the target is the band alone
              // — stretched to the label it would have overlapped a neighbour.
              const hitTop = compact ? entry.y - 3 : Math.min(entry.labelY - 15, entry.y - 3);
              const hitBottom = compact
                ? entry.y + entry.height + 3
                : Math.max(entry.labelY + 16, entry.y + entry.height + 3);
              return (
                <g
                  key={`${key}-${entry.band.id}`}
                  onMouseEnter={() => setHovered(entry.band.id)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(entry.band.id)}
                  onBlur={() => setHovered(null)}
                  onClick={(event) => {
                    event.stopPropagation();
                    setPinned((current) =>
                      current === entry.band.id ? null : entry.band.id,
                    );
                  }}
                  role="button"
                  aria-pressed={pinned === entry.band.id}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      event.stopPropagation();
                      setPinned((current) => current === entry.band.id ? null : entry.band.id);
                    }
                  }}
                  tabIndex={0}
                  aria-label={`${entry.band.label}: ${formatGbp(entry.band.amount)}`}
                  className="cursor-pointer outline-none"
                >
                  
                  <rect
                    x={hitX}
                    y={hitTop}
                    width={hitW}
                    height={Math.max(hitBottom - hitTop, 12)}
                    // Paints nothing — the hit area, where only the box matters.
                    fill="currentColor"
                    fillOpacity={0}
                  />
                  {!compact && (
                  <path
                    d={bracket(key, entry.labelY, centre)}
                    fill="none"
                    stroke={picked ? FF_INK : FF_RULE}
                    strokeWidth={picked ? 1 : 0.7}
                    
                    pathLength={1}
                    opacity={revealed ? labelOpacity(entry.band.id) : 0}
                    className={revealed ? "ff-draw transition-opacity" : undefined}
                    style={{ animationDelay: `${step + 0.15}s` }}
                  />
                  )}
                  <rect
                    x={x}
                    y={entry.y}
                    width={NODE_W}
                    height={Math.max(entry.height, 2)}
                    fill={entry.shade}
                    opacity={revealed ? bandOpacity(entry.band.id) : 0}
                    className={revealed ? "ff-grow transition-opacity" : undefined}
                    style={{
                      transformOrigin: `${x}px ${entry.y + Math.max(entry.height, 2)}px`,
                      animationDelay: `${step}s`,
                    }}
                  />
                  {!compact && (
                  <g
                    className={
                      revealed
                        ? key === "in"
                          ? "ff-slide-in"
                          : "ff-slide-out"
                        : undefined
                    }
                    opacity={revealed ? labelOpacity(entry.band.id) : 0}
                    style={{ animationDelay: `${step + 0.12}s` }}
                  >
                    <text
                      x={textX}
                      y={entry.labelY - 3}
                      textAnchor={anchor}
                      fontSize={10}
                      fontWeight={700}
                      fill={FF_INK}
                    >
                      {entry.band.label}
                    </text>
                    <text
                      x={textX}
                      y={entry.labelY + 8}
                      textAnchor={anchor}
                      fontSize={9.5}
                      fill={FF_DIM}
                    >
                      {formatCompactGbp(entry.band.amount)} · {share(entry.share)}
                    </text>
                  </g>
                  )}
                </g>
              );
            });
          })}
        </svg>
        </div>

        {compact && (
          <div className="mt-3 grid gap-4">
            {sides.map(({ key, placed }) => (
              <div key={`list-${key}`}>
                <p className="text-[11px] font-extrabold tracking-[0.09em] text-ink">
                  {key === "in" ? "MONEY IN" : "MONEY OUT"}
                </p>
                <ul className="mt-1">
                  {placed.map((entry) => (
                    <li key={`list-${key}-${entry.band.id}`}>
                      <button
                        type="button"
                        aria-pressed={pinned === entry.band.id}
                        onClick={(event) => {
                          event.stopPropagation();
                          setPinned((current) =>
                            current === entry.band.id ? null : entry.band.id,
                          );
                        }}
                        style={{ opacity: labelOpacity(entry.band.id) }}
                        className="flex min-h-11 w-full cursor-pointer items-center gap-2.5 border-b border-rule-soft text-left transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lead"
                      >
                        <span
                          aria-hidden="true"
                          className="size-3 shrink-0 rounded-inset"
                          style={{ backgroundColor: entry.shade }}
                        />
                        <span className="min-w-0 flex-1 text-[13px] font-semibold text-ink">
                          {entry.band.label}
                        </span>
                        <span className="shrink-0 font-mono text-[12px] tabular-nums text-dim">
                          {formatCompactGbp(entry.band.amount)} · {share(entry.share)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

      <p className="mt-2 min-h-[22px] text-[14px] leading-snug font-medium text-lead" aria-live="polite">
        {active ? (
          <>
            <span className="font-semibold text-ink">{active.band.label}</span> —{" "}
            {formatGbp(active.band.amount)}, {share(active.share)} of the{" "}
            {formatCompactGbp(flow.total)} that passed through
            {active.band.kind === "surplus" &&
              " · what the year's income left after spending"}
            {active.band.kind === "reserves" &&
              " · spending the year's income did not cover"}
            {pinned && (
              <span className="ml-2 font-mono text-[9.5px] font-bold tracking-[0.1em] text-faint">
                PINNED · CLICK AGAIN TO RELEASE
              </span>
            )}
          </>
        ) : (
          coarseSides.length === 2
            ? "Both bands are the year's filed totals. Select one to trace it; select it again to unpin."
            : "Every band is money the annual return itself reports. Select one to trace it; select it again to unpin."
        )}
      </p>

      {coarseSides.length > 0 && (
        <p className="mt-1.5 text-[12px] leading-[1.5] text-faint">
          
          {coarseSides.length === 2
            ? "Drawn from the year's filed totals — no breakdown of income or spending was published for this year."
            : `Drawn from the year's filed total for ${coarseSides[0]} — no breakdown of it was published for this year.`}
        </p>
      )}
    </div>

      {showDetails && (flow.incomeDetail.length > 0 || flow.spendDetail.length > 0) && (
        <div
          className="mt-3 rounded-inset border px-4 py-3"
          style={{ borderColor: PLATE_EDGE, backgroundColor: PLATE }}
        >
          <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {flow.incomeDetail.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5">
                  <h4
                    className="text-[12.5px] font-semibold"
                    style={{ color: FF_INK }}
                  >
                    Included in income
                  </h4>
                  <InfoTooltip content="Already counted in the bands above" />
                </div>
                <ul
                  className="mt-2 space-y-1.5 border-t pt-2"
                  style={{ borderColor: `color-mix(in oklab, ${FF_RULE} 50%, transparent)` }}
                >
                  {flow.incomeDetail.map((source) => (
                    <li
                      key={source.label}
                      className="flex items-baseline justify-between gap-3 text-[12.5px]"
                    >
                      <span style={{ color: FF_DIM }}>{source.label}</span>
                      <span
                        className="font-mono tabular-nums font-medium"
                        style={{ color: FF_INK }}
                      >
                        {formatCompactGbp(source.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {flow.spendDetail.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5">
                  <h4
                    className="text-[12.5px] font-semibold"
                    style={{ color: FF_INK }}
                  >
                    Included in spending
                  </h4>
                  <InfoTooltip content="Already counted in the bands above" />
                </div>
                <ul
                  className="mt-2 space-y-1.5 border-t pt-2"
                  style={{ borderColor: `color-mix(in oklab, ${FF_RULE} 50%, transparent)` }}
                >
                  {flow.spendDetail.map((use) => (
                    <li
                      key={use.label}
                      className="flex items-baseline justify-between gap-3 text-[12.5px]"
                    >
                      <span style={{ color: FF_DIM }}>
                        {use.label}
                        {use.within && (
                          <span className="text-[11.5px]" style={{ color: FF_FAINT }}>
                            {" "}
                            (inside {use.within})
                          </span>
                        )}
                      </span>
                      <span
                        className="font-mono tabular-nums font-medium"
                        style={{ color: FF_INK }}
                      >
                        {formatCompactGbp(use.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {Math.max(flow.incomeDrift, flow.spendDrift) > 0.001 && (
            <p
              className="mt-2.5 border-t pt-2 text-[11.5px] leading-[1.5]"
              style={{ borderColor: FF_RULE, color: FF_FAINT }}
            >
              The filed lines and the filed totals differ by ${(
                Math.max(flow.incomeDrift, flow.spendDrift) * 100
              ).toFixed(1)}% this year, which is the return restating a figure between the two.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
