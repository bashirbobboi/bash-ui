"use client";

import { useId, useMemo, useState } from "react";

import type { FinancialYear } from "./financial-history-types";
import {
  calculateTimelineOverviewPoints,
  type TrendMetric,
} from "./financial-history-math";
import { INCOME } from "./financial-history-parts";

export type { TrendMetric };

interface TimelineOverviewScrubberProps {
  years: FinancialYear[];
  hovered?: number | null;
  onHover?: (index: number | null) => void;
  className?: string;
}

export function TimelineOverviewScrubber({
  years,
  className = "",
}: TimelineOverviewScrubberProps) {
  const gradientId = useId().replace(/:/g, "");
  const [metric, setMetric] = useState<TrendMetric>("income");

  const length = years.length;

  // Calculate curve points based on active metric
  const { curvePoints, splineLine, splineFill, zeroYPercent } = useMemo(
    () => calculateTimelineOverviewPoints(years, metric),
    [years, metric],
  );

  if (length < 2) return null;

  return (
    <div className={`select-none ${className}`}>
      
      <div className="flex items-center pb-2">
        <div
          role="group"
          aria-label="Metric view"
          className="inline-flex items-center rounded-inset bg-paper-sunk/70 p-0.5 border border-rule-soft/60"
        >
          <button
            type="button"
                        aria-pressed={metric === "income"}
            onClick={() => setMetric("income")}
            className={`rounded-inset px-2 py-0.5 font-mono text-[11px] transition-all ${
              metric === "income"
                ? "bg-card text-ink font-semibold shadow-xs border border-rule-soft/60"
                : "text-dim hover:text-ink"
            }`}
          >
            Income
          </button>
          <button
            type="button"
                        aria-pressed={metric === "net"}
            onClick={() => setMetric("net")}
            className={`rounded-inset px-2 py-0.5 font-mono text-[11px] transition-all ${
              metric === "net"
                ? "bg-card text-ink font-semibold shadow-xs border border-rule-soft/60"
                : "text-dim hover:text-ink"
            }`}
          >
            Net result
          </button>
        </div>
      </div>

      <div className="relative h-[64px] sm:h-[76px] w-full overflow-hidden rounded-inset bg-card border border-rule-soft">
        
        <svg
          className="absolute inset-0 h-full w-full overflow-visible"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id={`${gradientId}-income-wash`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={INCOME} stopOpacity={0.16} />
              <stop offset="80%" stopColor={INCOME} stopOpacity={0.03} />
              <stop offset="100%" stopColor={INCOME} stopOpacity={0} />
            </linearGradient>
            <linearGradient
              id={`${gradientId}-lead-wash`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor="var(--lead)" stopOpacity={0.14} />
              <stop offset="80%" stopColor="var(--lead)" stopOpacity={0.03} />
              <stop offset="100%" stopColor="var(--lead)" stopOpacity={0} />
            </linearGradient>
          </defs>

          {zeroYPercent !== null && (
            <line
              x1="0"
              x2="100"
              y1={zeroYPercent}
              y2={zeroYPercent}
              stroke="var(--rule)"
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />
          )}

          <path
            d={splineFill}
            fill={`url(#${gradientId}-${metric === "income" ? "income-wash" : "lead-wash"})`}
          />

          <path
            d={splineLine}
            fill="none"
            // `style`, not `stroke={…}`: `INCOME` is a CSS `light-dark()` pair
            // and a presentation attribute does not parse one.
            style={{ stroke: metric === "income" ? INCOME : "var(--lead)" }}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        <div className="absolute inset-0 flex">
          {years.map((year, index) => {
            const pt = curvePoints[index];

            return (
              <div
                key={year.periodEnd}
                className="relative flex h-full flex-1 flex-col items-center justify-end pb-1.5"
              >
                
                {pt && (
                  <div
                    className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: "50%", top: `${Number(pt.y.toFixed(6))}%` }}
                  >
                    <span className="block size-1.5 rounded-full bg-lead/70" />
                  </div>
                )}

                <span className="font-mono text-[11px] tabular-nums text-faint">
                  {year.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
