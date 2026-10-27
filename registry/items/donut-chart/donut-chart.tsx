"use client";

import { motion, useReducedMotionConfig } from "motion/react";
import { useState } from "react";

// Where every naira collected ends up. Three slices that sum to gross:
//   landlord net + Ledge's cut + Paystack's fee = gross collected.
// Paystack's fee is carved out of Ledge's platform fee (platform_fee − paystack_fee),
// so it reads as a slice of "our" money, not an extra charge on the tenant.
export type DonutChartProps = {
  title?: string;
  platformLabel?: string;
  processingLabel?: string;
  animated?: boolean;
  grossKobo: number;
  landlordNetKobo: number;
  ledgeKobo: number; // platform fee kept by Ledge, after Paystack's cut
  paystackKobo: number; // Paystack's processing fee
};

// Ledge’s emerald, gold and clay series colours, supplied by the active theme.
const SERIES = [
  { key: "landlord", label: "Paid to landlord", color: "var(--collection-landlord)" },
  { key: "ledge", label: "Ledge's money", color: "var(--collection-platform)" },
  { key: "paystack", label: "Paystack fees", color: "var(--collection-processing)" },
] as const;

const CX = 110;
const CY = 110;
const R = 78;
const W = 30;
const GAP_DEG = 1.5; // surface gap between segments

function polar(angleDeg: number, r = R) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function arc(startDeg: number, endDeg: number) {
  const span = endDeg - startDeg;
  // Only inset for the surface gap when the slice is wide enough to keep a sliver.
  const inset = span > GAP_DEG * 2 ? GAP_DEG / 2 : 0;
  const a0 = startDeg + inset;
  const a1 = endDeg - inset;
  const p0 = polar(a0);
  const p1 = polar(a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${p0.x} ${p0.y} A ${R} ${R} 0 ${large} 1 ${p1.x} ${p1.y}`;
}

export function DonutChart({
  title = "Where the money goes",
  platformLabel = "Ledge’s money",
  processingLabel = "Paystack fees",
  animated = true,
  grossKobo,
  landlordNetKobo,
  ledgeKobo,
  paystackKobo,
}: DonutChartProps) {
  const reducedMotion = useReducedMotionConfig();
  const [active, setActive] = useState<number | null>(null);

  const values = [landlordNetKobo, ledgeKobo, paystackKobo];
  const total = grossKobo || 1; // guard divide-by-zero on an empty landlord

  // Build cumulative arcs.
  let cursor = 0;
  const segments = values.map((v, i) => {
    const frac = v / total;
    const start = cursor * 360;
    cursor += frac;
    const end = cursor * 360;
    return { ...SERIES[i], label: i === 1 ? platformLabel : i === 2 ? processingLabel : SERIES[i].label, value: v, frac, start, end };
  });

  if (grossKobo === 0) {
    return (
      <section className="@container w-full min-w-0 space-y-3 font-body text-ink">
        <h2 className="font-heading text-xl">{title}</h2>
        <p className="rounded-panel border border-rule bg-card px-4 py-10 text-center text-sm text-dim">
          No payments collected yet.
        </p>
      </section>
    );
  }

  return (
    <section className="@container w-full min-w-0 space-y-3 font-body text-ink">
      <h2 className="font-heading text-xl">{title}</h2>
      <div className="rounded-panel border border-rule bg-card flex flex-col items-center gap-8 p-6 @xl:flex-row @xl:gap-10">
        
        <div
          className="relative shrink-0"
          style={{ width: 200, height: 200 }}
        >
          <svg
            viewBox="0 0 220 220"
            width={200}
            height={200}
            role="group"
            aria-label={`Of ${formatKobo(grossKobo)} collected, ${formatKobo(
              landlordNetKobo,
            )} paid to landlord, ${formatKobo(ledgeKobo)} to ${platformLabel}, ${formatKobo(
              paystackKobo,
            )} ${processingLabel}.`}
          >
            {segments.map((s, i) => (
              <motion.path
                key={s.key}
                d={s.value > 0 ? arc(s.start, s.end) : ""} tabIndex={s.value > 0 ? 0 : -1} role="button" aria-label={`${s.label}: ${formatKobo(s.value)}, ${(s.frac * 100).toFixed(1)}%`} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setActive(i); } }}
                fill="none"
                stroke={s.color}
                strokeWidth={active === i ? W + 6 : W}
                strokeLinecap="butt"
                pathLength={1}
                opacity={active === null || active === i ? 1 : 0.35}
                className="cursor-pointer transition-[stroke-width,opacity] duration-150 motion-reduce:transition-none"
                initial={{ pathLength: animated && !reducedMotion ? 0 : 1 }} animate={{ pathLength: 1 }} transition={{ duration: reducedMotion || !animated ? 0 : 0.7, delay: reducedMotion || !animated ? 0 : i * 0.12 }}
                onPointerEnter={() => setActive(i)} onFocus={() => setActive(i)} onBlur={() => setActive(null)}
                onPointerLeave={() => setActive(null)}
              />
            ))}
          </svg>
          
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <div
              className="text-[0.7rem] font-medium leading-none"
              style={{ color: active === null ? "var(--dim)" : segments[active].color }}
            >
              {active === null ? "Collected" : segments[active].label}
            </div>
            <div className="mt-1.5 font-heading text-xl leading-none text-ink">
              {formatKobo(active === null ? grossKobo : segments[active].value)}
            </div>
            {/* The hovered slice reads out here, in the hole, rather than in a
                floating card that would sit on the ring and hide the slice. */}
            {active !== null && (
              <div className="mt-1 text-[0.7rem] tabular-nums text-dim">
                {(segments[active].frac * 100).toFixed(1)}%
              </div>
            )}
          </div>
          
        </div>

        <ul className="w-full space-y-2 text-sm">
          {segments.map((s, i) => (
            <li
              key={s.key}
              tabIndex={0} className="flex min-h-11 flex-wrap items-center justify-between gap-4 rounded-inset px-2 py-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-lead"
              style={{ background: active === i ? "var(--paper)" : "transparent" }}
              onPointerEnter={() => setActive(i)} onFocus={() => setActive(i)} onBlur={() => setActive(null)}
              onPointerLeave={() => setActive(null)}
            >
              <span className="flex items-center gap-2.5">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-inset"
                  style={{ background: s.color }}
                  aria-hidden
                />
                <span className="text-ink">{s.label}</span>
              </span>
              <span className="flex items-baseline gap-2">
                <span className="font-heading tabular-nums text-ink">
                  {formatKobo(s.value)}
                </span>
                <span className="w-10 text-right text-xs tabular-nums text-dim">
                  {(s.frac * 100).toFixed(1)}%
                </span>
              </span>
            </li>
          ))}
        </ul>
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
