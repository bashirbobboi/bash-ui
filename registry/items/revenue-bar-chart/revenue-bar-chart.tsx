"use client";

import { motion, useReducedMotionConfig } from "motion/react";
import { useState } from "react";

// Monthly platform revenue, split into what Ledge keeps vs what Paystack takes.
// Each bar's height = platform fee for the month, stacked as Ledge net (gold, kept)
// + Paystack fee (clay, cost). "To landlords" (emerald) is off by default: it's
// ~20x the fee, so enabling it rescales the bars to full GMV and the revenue split
// becomes a thin band at the base — honest, but it flattens the revenue signal.
export type MonthPoint = {
  month: string; // ISO date (first of month)
  grossKobo: number;
  platformFeeKobo: number;
  paystackKobo: number;
};

const LEDGE = "var(--collection-platform)"; // matches "Ledge's money" in the donut
const PAYSTACK = "var(--collection-processing)"; // matches "Paystack fees"
const LANDLORD = "var(--collection-landlord)"; // matches "Paid to landlord"
const CHART_H = 176; // px plot height

function monthLabel(iso: string) {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-NG", {
    month: "short",
    timeZone: "UTC",
  });
}

export type RevenueBarChartProps = { data: MonthPoint[]; title?: string; defaultShowLandlords?: boolean; animated?: boolean };
export function RevenueBarChart({ data, title = "Monthly revenue", defaultShowLandlords = false, animated = true }: RevenueBarChartProps) {
  const reducedMotion = useReducedMotionConfig();
  const [active, setActive] = useState<number | null>(null);
  const [showGMV, setShowGMV] = useState(defaultShowLandlords);

  const totalOf = (d: MonthPoint) => (showGMV ? d.grossKobo : d.platformFeeKobo);
  const max = Math.max(1, ...data.map(totalOf));
  const hasAny = data.some((d) => d.platformFeeKobo > 0);
  // The breakdown is always on screen, so hovering a bar never changes the
  // card's height: it shows the latest month until a bar is picked.
  const shown = data[active ?? data.length - 1];

  return (
    <section className="w-full min-w-0 space-y-3 font-body text-ink">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-heading text-xl">{title}</h2>
        <div className="flex flex-wrap items-center gap-4 text-xs text-dim">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-inset" style={{ background: LEDGE }} />
            Ledge net
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-inset" style={{ background: PAYSTACK }} />
            Paystack fee
          </span>
          
          <button
            type="button"
            onClick={() => setShowGMV((v) => !v)}
            className="flex items-center gap-1.5 transition-opacity"
            style={{ opacity: showGMV ? 1 : 0.45 }}
            aria-pressed={showGMV}
          >
            <span className="inline-block h-2.5 w-2.5 rounded-inset" style={{ background: LANDLORD }} />
            <span className={showGMV ? "" : "line-through"}>To landlords</span>
            <span className="text-[0.6rem] uppercase tracking-wide">
              {showGMV ? "remove" : "add"}
            </span>
          </button>
        </div>
      </div>

      <div className="rounded-panel border border-rule bg-card p-6">
        {!hasAny ? (
          <p className="py-10 text-center text-sm text-dim">
            No revenue in this window yet.
          </p>
        ) : (
          <div className="relative">
            <div className="flex items-end justify-between gap-1.5" style={{ height: CHART_H }}>
              {data.map((d, i) => {
                const ledgeKobo = Math.max(0, d.platformFeeKobo - d.paystackKobo);
                const landlordKobo = Math.max(0, d.grossKobo - d.platformFeeKobo);
                const total = totalOf(d);
                const barH = (total / max) * CHART_H;
                // Segments top → bottom; each height is its share of the bar.
                const px = (v: number) => (total > 0 ? (v / total) * barH : 0);
                const segments = [
                  ...(showGMV ? [{ c: LANDLORD, h: px(landlordKobo) }] : []),
                  { c: PAYSTACK, h: px(d.paystackKobo) },
                  { c: LEDGE, h: px(ledgeKobo) },
                ].filter((seg) => seg.h > 0);
                const on = active === i;
                return (
                  <div
                    key={d.month}
                    tabIndex={0} role="button" aria-label={`${monthLabel(d.month)}: platform fee ${formatKobo(d.platformFeeKobo)}, rent collected ${formatKobo(d.grossKobo)}`} onFocus={() => setActive(i)} onBlur={() => setActive(null)} onClick={() => setActive(i)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setActive(i); } }} className="group flex h-full min-w-0 flex-1 flex-col justify-end rounded-inset focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lead"
                    onMouseEnter={() => setActive(i)}
                    onMouseLeave={() => setActive(null)}
                  >
                    <motion.div
                      initial={{ scaleY: animated && !reducedMotion ? 0 : 1 }} whileInView={{ scaleY: 1 }} viewport={{ once: true }} transition={{ duration: reducedMotion || !animated ? 0 : 0.7, delay: reducedMotion || !animated ? 0 : i * 0.045 }}
                      className="flex w-full flex-col justify-end transition-opacity motion-reduce:transition-none"
                      style={{
                        height: Number(barH.toFixed(6)),
                        opacity: active === null || on ? 1 : 0.4,
                        transformOrigin: "bottom",
                      }}
                    >
                      {segments.map((seg, si) => (
                        <div
                          key={si}
                          style={{
                            height: Number((si === segments.length - 1 ? Math.max(2, seg.h) : seg.h).toFixed(6)),
                            background: seg.c,
                            borderTopLeftRadius: si === 0 ? "var(--inset-radius)" : 0,
                            borderTopRightRadius: si === 0 ? "var(--inset-radius)" : 0,
                            marginBottom: si < segments.length - 1 ? 2 : 0,
                          }}
                        />
                      ))}
                    </motion.div>
                    <div className="mt-2 text-center text-[0.65rem] text-dim">
                      {monthLabel(d.month)}
                    </div>
                  </div>
                );
              })}
            </div>

            {shown && (
              <div className="mt-4 rounded-panel border border-rule bg-paper p-3 text-sm">
                <div className="mb-1 font-medium">
                  {new Date(shown.month + "T00:00:00Z").toLocaleDateString("en-NG", {
                    month: "long",
                    year: "numeric",
                    timeZone: "UTC",
                  })}
                </div>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                  <dt className="text-dim">Platform fee</dt>
                  <dd className="text-right font-heading tabular-nums">
                    {formatKobo(shown.platformFeeKobo)}
                  </dd>
                  <dt className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-inset" style={{ background: LEDGE }} />
                    Ledge net
                  </dt>
                  <dd className="text-right font-heading tabular-nums">
                    {formatKobo(Math.max(0, shown.platformFeeKobo - shown.paystackKobo))}
                  </dd>
                  <dt className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-inset" style={{ background: PAYSTACK }} />
                    Paystack fee
                  </dt>
                  <dd className="text-right font-heading tabular-nums">
                    {formatKobo(shown.paystackKobo)}
                  </dd>
                  <dt className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-inset" style={{ background: LANDLORD }} />
                    To landlords
                  </dt>
                  <dd className="text-right font-heading tabular-nums">
                    {formatKobo(Math.max(0, shown.grossKobo - shown.platformFeeKobo))}
                  </dd>
                  <dt className="text-dim">Rent collected (GMV)</dt>
                  <dd className="text-right font-heading tabular-nums text-dim">
                    {formatKobo(shown.grossKobo)}
                  </dd>
                </dl>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export function formatKobo(kobo: number): string {
  const naira = kobo / 100;
  return (
    "₦" +
    naira.toLocaleString("en-NG", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })
  );
}
