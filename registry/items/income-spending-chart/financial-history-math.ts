import type { FinancialYear } from "./financial-history-types.ts";

export type TrendMetric = "income" | "net";

export interface TimelineOverviewCalculation {
  curvePoints: { x: number; y: number }[];
  splineLine: string;
  splineFill: string;
  zeroYPercent: number | null;
}

const TOP_Y = 10;
const BOTTOM_Y = 68;

const MIN_SPAN_OF_PEAK = 0.1;
export const NET_ZERO_Y = 40;

export function calculateTimelineOverviewPoints(
  years: FinancialYear[],
  metric: TrendMetric,
): TimelineOverviewCalculation {
  const length = years.length;
  if (length < 2) {
    return { curvePoints: [], splineLine: "", splineFill: "", zeroYPercent: null };
  }

  if (metric === "income") {
    const incomes = years.map((y) => y.income ?? 0);
    const maxIncome = Math.max(...incomes, 1);
    const minIncome = Math.min(...incomes);
    const span = Math.max(maxIncome - minIncome, maxIncome * MIN_SPAN_OF_PEAK);
    // Centre the data in the span, so a small real change sits mid-strip
    // rather than pinned to one edge.
    const floor = (maxIncome + minIncome) / 2 - span / 2;
    const rangeY = BOTTOM_Y - TOP_Y;

    const pts = years.map((y, i) => {
      const val = y.income ?? 0;
      const x = ((i + 0.5) / length) * 100;
      const yCoord = BOTTOM_Y - ((val - floor) / span) * rangeY;
      return { x, y: Math.max(TOP_Y, Math.min(BOTTOM_Y, yCoord)) };
    });

    const { line, fill } = buildMonotoneSplinePath(pts);
    return { curvePoints: pts, splineLine: line, splineFill: fill, zeroYPercent: null };
  }

  // Net result mode (surplus/deficit)
  const nets = years.map((y) => y.net ?? 0);
  const absMax = Math.max(...nets.map(Math.abs), 1);
  const midY = NET_ZERO_Y;
  const maxOffset = Math.min(midY - TOP_Y, BOTTOM_Y - midY);

  const pts = years.map((y, i) => {
    const netVal = y.net ?? 0;
    const x = ((i + 0.5) / length) * 100;
    const yCoord = midY - (netVal / absMax) * maxOffset;
    return { x, y: Math.max(TOP_Y, Math.min(BOTTOM_Y, yCoord)) };
  });

  const { line, fill } = buildMonotoneSplinePath(pts);
  return { curvePoints: pts, splineLine: line, splineFill: fill, zeroYPercent: midY };
}

export function buildMonotoneSplinePath(
  pts: { x: number; y: number }[],
): { line: string; fill: string } {
  const n = pts.length;
  if (n < 1) return { line: "", fill: "" };
  if (n === 1) {
    const y = Math.max(0, Math.min(100, pts[0].y));
    const line = `M 0 ${y.toFixed(2)} L 100 ${y.toFixed(2)}`;
    const fill = `${line} L 100 100 L 0 100 Z`;
    return { line, fill };
  }

  // 1. Calculate secants (slopes) & dx
  const dxs = new Float64Array(n - 1);
  const deltas = new Float64Array(n - 1);
  for (let i = 0; i < n - 1; i++) {
    dxs[i] = pts[i + 1].x - pts[i].x;
    deltas[i] = dxs[i] === 0 ? 0 : (pts[i + 1].y - pts[i].y) / dxs[i];
  }

  // 2. Tangents
  const m = new Float64Array(n);
  for (let i = 1; i < n - 1; i++) {
    if (deltas[i - 1] * deltas[i] <= 0) {
      m[i] = 0;
    } else {
      const hPrev = dxs[i - 1];
      const hNext = dxs[i];
      m[i] =
        (3 * (hPrev + hNext)) /
        ((2 * hNext + hPrev) / deltas[i - 1] + (hNext + 2 * hPrev) / deltas[i]);
    }
  }
  m[0] = deltas[0];
  if (deltas.length > 1 && deltas[0] * deltas[1] <= 0) m[0] = 0;
  m[n - 1] = deltas[n - 2];
  if (deltas.length > 1 && deltas[n - 2] * deltas[n - 3] <= 0) m[n - 1] = 0;

  // 3. Fritsch-Carlson monotonicity
  for (let i = 0; i < n - 1; i++) {
    if (deltas[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
    } else {
      const alpha = m[i] / deltas[i];
      const beta = m[i + 1] / deltas[i];
      const dist = alpha * alpha + beta * beta;
      if (dist > 9) {
        const tau = 3 / Math.sqrt(dist);
        m[i] = tau * alpha * deltas[i];
        m[i + 1] = tau * beta * deltas[i];
      }
    }
  }

  // 4. Cubic Bézier segments
  let line = `M ${pts[0].x.toFixed(2)} ${Math.max(0, Math.min(100, pts[0].y)).toFixed(2)}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    const dx = p1.x - p0.x;
    const cp1x = p0.x + dx / 3;
    const cp1y = Math.max(0, Math.min(100, p0.y + (m[i] * dx) / 3));
    const cp2x = p1.x - dx / 3;
    const cp2y = Math.max(0, Math.min(100, p1.y - (m[i + 1] * dx) / 3));
    const targetY = Math.max(0, Math.min(100, p1.y));
    line += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p1.x.toFixed(2)} ${targetY.toFixed(2)}`;
  }

  const fill = `${line} L ${pts[n - 1].x.toFixed(2)} 100 L ${pts[0].x.toFixed(2)} 100 Z`;
  return { line, fill };
}

