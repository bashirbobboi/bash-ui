"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotionConfig } from "motion/react";

import { formatCompactGbp, formatGbp } from "./financial-history-format";
import type { FinancialYear } from "./financial-history-types";
export type { FinancialYear } from "./financial-history-types";
import {
  calculateNiceYAxis,
  DEFICIT,
  EXPENDITURE,
  INCOME,
  SURPLUS,
} from "./financial-history-parts";
import { TimelineOverviewScrubber } from "./timeline-overview-scrubber";
import { formatUkDate } from "./financial-history-format";

const MAX_BARREL_STICKS = 36;
const MAX_NET_STICKS = 10;

export type IncomeSpendingChartProps = {
  years: FinancialYear[];
  showOverview?: boolean;
  animated?: boolean;
};
export function IncomeSpendingChart({ years, showOverview = true, animated = true }: IncomeSpendingChartProps) {
  const reducedMotion = useReducedMotionConfig();

  const containerRef = useRef<HTMLDivElement>(null);
  const [hasEnteredView, setHasEnteredView] = useState(false);
  const peak = Math.max(0, ...years.flatMap((year) => [year.income ?? 0, year.expenditure ?? 0]));
  const peakNet = Math.max(0, ...years.map((year) => Math.abs(year.net ?? 0)));
  const visible = !animated || reducedMotion || hasEnteredView;

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      const frame = requestAnimationFrame(() => setHasEnteredView(true));
      return () => cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setHasEnteredView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(node);

    const timer = setTimeout(() => setHasEnteredView(true), 1200);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);

  const yAxis = useMemo(() => calculateNiceYAxis(peak), [peak]);
  // One year at a time: pointing at any of a year's three marks — or its
  // label — picks the whole year, so its figures read together in one tooltip
  // instead of three separate hovers.
  const [hovered, setHovered] = useState<number | null>(null);
  const hoverProps = (index: number) => ({
    onPointerEnter: () => setHovered(index),
  });
  const dimmed = (index: number) => hovered !== null && hovered !== index;

  if (years.length === 0) return null;

  const safeYMax = yAxis.max > 0 ? yAxis.max : 1;
  const safePeakNet = peakNet > 0 ? peakNet : 1;

  return (
    <div ref={containerRef} className="@container w-full min-w-0 select-none font-body">
      {showOverview && years.length > 1 && (
        <div className="mb-4">
          <TimelineOverviewScrubber years={years} />
        </div>
      )}

      <div className="flex items-center justify-end">
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5" aria-label="Chart legend">
          <li className="flex items-center gap-2 text-[12px] text-dim">
            <span aria-hidden="true" className="flex flex-col gap-[1.5px]">
              <span className="h-[2px] w-3 rounded-full" style={{ backgroundColor: INCOME }} />
              <span className="h-[2px] w-3 rounded-full" style={{ backgroundColor: INCOME }} />
              <span className="h-[2px] w-3 rounded-full" style={{ backgroundColor: INCOME }} />
            </span>
            Income
          </li>
          <li className="flex items-center gap-2 text-[12px] text-dim">
            <span aria-hidden="true" className="flex flex-col gap-[1.5px]">
              <span className="h-[2px] w-3 rounded-full" style={{ backgroundColor: EXPENDITURE }} />
              <span className="h-[2px] w-3 rounded-full" style={{ backgroundColor: EXPENDITURE }} />
              <span className="h-[2px] w-3 rounded-full" style={{ backgroundColor: EXPENDITURE }} />
            </span>
            Spending
          </li>
        </ul>
      </div>

      <div onPointerLeave={() => setHovered(null)}>
      
      <div className="relative mt-4 pt-2.5">
        <div className="flex items-end">
          
          <div className="relative h-[214px] w-14 shrink-0 sm:w-16" aria-hidden="true">
            {yAxis.ticks.map((tick) => {
              const topPercent = (1 - tick / safeYMax) * 100;
              return (
                <div
                  key={tick}
                  className="absolute right-2.5 -translate-y-1/2 flex items-center justify-end"
                  style={{ top: `${Number(topPercent.toFixed(6))}%` }}
                >
                  <span className="font-mono text-[10.5px] tabular-nums text-faint">
                    {formatCompactGbp(tick)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="relative h-[214px] flex-1 min-w-0">
            
            <div className="pointer-events-none absolute inset-0" aria-hidden="true">
              {yAxis.ticks.map((tick) => {
                const topPercent = (1 - tick / safeYMax) * 100;
                const isZero = tick === 0;
                return (
                  <div
                    key={`grid-${tick}`}
                    className={`absolute inset-x-0 h-px ${
                      isZero ? "bg-rule" : "bg-rule-soft/60"
                    }`}
                    style={{ top: `${Number(topPercent.toFixed(6))}%` }}
                  />
                );
              })}
            </div>

            <div className="relative flex h-full items-end gap-2">
              {years.map((year, index) => {
                const hasIncome = year.income !== null && year.income > 0;
                const hasExpenditure = year.expenditure !== null && year.expenditure > 0;

                const incomeStickCount = hasIncome
                  ? Math.max(1, Math.min(MAX_BARREL_STICKS, Math.round((year.income! / safeYMax) * MAX_BARREL_STICKS)))
                  : 0;

                const expStickCount = hasExpenditure
                  ? Math.max(1, Math.min(MAX_BARREL_STICKS, Math.round((year.expenditure! / safeYMax) * MAX_BARREL_STICKS)))
                  : 0;

                return (
                  <div
                    key={year.periodEnd}
                    aria-label={`${year.label}: income ${formatGbp(year.income)}, spending ${formatGbp(year.expenditure)}${
                      year.net !== null
                        ? `, ${year.net >= 0 ? "surplus" : "deficit"} ${formatGbp(Math.abs(year.net))}`
                        : ""
                    }`}
                    role="button"
                    tabIndex={0}
                    onClick={() => setHovered(index)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setHovered(index);
                      }
                    }}
                    onFocus={() => setHovered(index)}
                    onBlur={() => setHovered(null)}
                    {...hoverProps(index)}
                    className="relative flex h-full min-w-0 flex-1 flex-col items-center justify-end rounded-t-panel px-1 outline-none focus-visible:ring-2 focus-visible:ring-lead-mid"
                  >
                    {hovered === index && (
                      <YearTooltip
                        year={year}
                        // Beside the column, never over it: the tooltip is read
                        // against the bars it describes. Right of the first half
                        // of the years, left of the second, so it stays inside
                        // the plot.
                        side={index < years.length / 2 ? "right" : "left"}
                      />
                    )}
                    
                    <div
                      className="flex items-end gap-1 pb-0.5 transition-opacity duration-150 @sm:gap-2"
                      style={{ opacity: dimmed(index) ? 0.35 : 1 }}
                    >
                      
                      <div className="flex h-[214px] flex-col-reverse justify-start gap-[2px]" aria-hidden="true">
                        {hasIncome ? (
                          Array.from({ length: incomeStickCount }, (_, stickIdx) => (
                            <motion.div
                              key={`inc-stick-${stickIdx}`}
                              initial={animated && !reducedMotion ? { opacity: 0, scaleX: 0.6, originX: 0.5 } : false}
                              animate={{
                                opacity: visible ? 1 : 0,
                                scaleX: visible ? 1 : 0.6,
                              }}
                              transition={{
                                duration: 0.2,
                                delay: index * 0.05 + stickIdx * 0.008,
                                ease: [0.16, 1, 0.3, 1],
                              }}
                              className="h-[4px] w-[clamp(6px,2cqw,18px)] rounded-inset transition-all duration-150 @sm:w-[22px]"
                              style={{ backgroundColor: INCOME }}
                            />
                          ))
                        ) : year.income !== null ? (
                          <span className="h-[2px] w-[clamp(6px,2cqw,18px)] rounded-full bg-rule-soft @sm:w-[22px]" />
                        ) : null}
                      </div>

                      <div className="flex h-[214px] flex-col-reverse justify-start gap-[2px]" aria-hidden="true">
                        {hasExpenditure ? (
                          Array.from({ length: expStickCount }, (_, stickIdx) => (
                            <motion.div
                              key={`exp-stick-${stickIdx}`}
                              initial={animated && !reducedMotion ? { opacity: 0, scaleX: 0.6, originX: 0.5 } : false}
                              animate={{
                                opacity: visible ? 1 : 0,
                                scaleX: visible ? 1 : 0.6,
                              }}
                              transition={{
                                duration: 0.2,
                                delay: index * 0.05 + 0.02 + stickIdx * 0.008,
                                ease: [0.16, 1, 0.3, 1],
                              }}
                              className="h-[4px] w-[clamp(6px,2cqw,18px)] rounded-inset transition-all duration-150 @sm:w-[22px]"
                              style={{ backgroundColor: EXPENDITURE }}
                            />
                          ))
                        ) : year.expenditure !== null ? (
                          <span className="h-[2px] w-[clamp(6px,2cqw,18px)] rounded-full bg-rule-soft @sm:w-[22px]" />
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-start pt-1.5">
        <div className="flex w-14 shrink-0 items-start justify-end pr-2.5 pt-1 sm:w-16" aria-hidden="true">
          <span className="font-mono text-[10px] font-medium tracking-wider text-faint uppercase">
            Net
          </span>
        </div>
        <div className="flex min-h-[82px] flex-1 min-w-0 items-start gap-2">
          {years.map((year, index) => {
            const net = year.net;
            const hasNet = net !== null && Math.abs(net) > 0;
            const netStickCount = hasNet
              ? Math.max(1, Math.min(MAX_NET_STICKS, Math.round((Math.abs(net) / safePeakNet) * MAX_NET_STICKS)))
              : 0;
            const netColor = net !== null && net >= 0 ? SURPLUS : DEFICIT;

            return (
              <div
                key={year.periodEnd}
                {...hoverProps(index)}
                className="flex flex-1 flex-col items-center justify-start rounded-b-panel px-1 pb-1 transition-opacity duration-150"
                style={{ opacity: dimmed(index) ? 0.35 : 1 }}
              >
                
                <div className="flex min-h-[58px] flex-col justify-start gap-[2px]" aria-hidden="true">
                  {hasNet ? (
                    Array.from({ length: netStickCount }, (_, stickIdx) => (
                      <motion.div
                        key={`net-stick-${stickIdx}`}
                        initial={animated && !reducedMotion ? { opacity: 0, scaleX: 0.6, originX: 0.5 } : false}
                        animate={{
                          opacity: visible ? 1 : 0,
                          scaleX: visible ? 1 : 0.6,
                        }}
                        transition={{
                          duration: 0.18,
                          delay: index * 0.05 + 0.1 + stickIdx * 0.012,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        className="h-[4px] w-[clamp(8px,2.5cqw,20px)] rounded-inset transition-all duration-150 @sm:w-[24px]"
                        style={{ backgroundColor: netColor }}
                      />
                    ))
                  ) : (
                    <div className="h-[4px] w-[clamp(8px,2.5cqw,20px)] @sm:w-[24px]" />
                  )}
                </div>

                <span
                  className={`mt-1 font-mono text-[9px] @sm:text-[11px] tabular-nums transition-colors ${
                    net === null ? "text-faint" : net >= 0 ? "text-go font-medium" : "text-stop font-medium"
                  }`}
                >
                  {net === null
                    ? "—"
                    : `${net >= 0 ? "+" : "−"}${formatCompactGbp(Math.abs(net))}`}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-1 flex items-center">
        <div className="w-14 shrink-0 sm:w-16" aria-hidden="true" />
        <div className="flex flex-1 min-w-0 gap-2">
          {years.map((year, index) => (
            <span
              key={year.periodEnd}
              {...hoverProps(index)}
              className={`flex-1 text-center text-[11.5px] transition-colors ${
                hovered === index ? "font-semibold text-ink" : "text-dim"
              }`}
            >
              {year.label}
            </span>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}

function YearTooltip({
  year,
  side,
}: {
  year: FinancialYear;
  side: "left" | "right";
}) {
  const periodEnd = formatUkDate(year.periodEnd);
  const net = year.net;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute top-0 z-20 w-max max-w-[calc(100cqw-1rem)] rounded-panel border border-rule bg-card px-3 py-2.5 shadow-lg ${
        side === "right" ? "left-0 @lg:left-full @lg:ml-1" : "right-0 @lg:right-full @lg:mr-1"
      }`}
    >
      <p className="text-[12.5px] font-semibold text-ink">{year.label}</p>
      <p className="text-[11px] text-faint">Year ending {periodEnd}</p>
      <dl className="mt-2 space-y-1 text-[12.5px]">
        <TooltipRow colour={INCOME} label="Income" value={formatGbp(year.income)} />
        <TooltipRow
          colour={EXPENDITURE}
          label="Spending"
          value={formatGbp(year.expenditure)}
        />
        <div className="mt-1.5 border-t border-rule-soft pt-1.5">
          <TooltipRow
            colour={net === null ? undefined : net >= 0 ? SURPLUS : DEFICIT}
            label={net === null ? "Net" : net >= 0 ? "Surplus" : "Deficit"}
            value={
              net === null
                ? "Not reported"
                : `${net >= 0 ? "+" : "−"}${formatGbp(Math.abs(net))}`
            }
            valueClassName={
              net === null ? "text-faint" : net >= 0 ? "text-go" : "text-stop"
            }
          />
        </div>
      </dl>
    </div>
  );
}

function TooltipRow({
  colour,
  label,
  value,
  valueClassName = "text-ink",
}: {
  colour?: string;
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="flex items-center gap-1.5 text-dim">
        <span
          aria-hidden="true"
          className="size-2 shrink-0 rounded-inset"
          style={{ backgroundColor: colour ?? "transparent" }}
        />
        {label}
      </dt>
      <dd className={`font-body font-semibold tabular-nums ${valueClassName}`}>
        {value}
      </dd>
    </div>
  );
}

