import type { PeriodOption, PipelineSeries, SeriesPoint } from "./pipeline-chart.tsx";

/*
 * Fake data for the preview and the playground. Not shipped.
 */

const DAYS = 365;
const DAY_MS = 86_400_000;

/** Deterministic noise, so the server and the browser draw the same lines. */
function noise(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * A year of outreach ending on `end` (a UTC midnight): weekdays busier than
 * weekends, a slow ramp-up through the year, roughly one in four contacted
 * replying and one in four of those converting.
 */
function fakeFunnel(end: number): PipelineSeries[] {
  const contacted: SeriesPoint[] = [];
  const replied: SeriesPoint[] = [];
  const converted: SeriesPoint[] = [];
  for (let i = DAYS - 1; i >= 0; i -= 1) {
    const day = new Date(end - i * DAY_MS);
    const date = day.toISOString().slice(0, 10);
    const weekday = day.getUTCDay();
    const weekend = weekday === 0 || weekday === 6;
    const ramp = 0.6 + ((DAYS - i) / DAYS) * 0.8;
    const c = Math.round((weekend ? 2 : 11) * ramp * (0.6 + noise(i) * 0.8));
    const r = Math.round(c * (0.18 + noise(i + 400) * 0.16));
    const v = Math.round(r * (0.15 + noise(i + 800) * 0.25));
    contacted.push({ date, value: c });
    replied.push({ date, value: r });
    converted.push({ date, value: v });
  }
  return [
    { name: "Contacted", data: contacted },
    { name: "Replied", data: replied },
    { name: "Converted", data: converted },
  ];
}

let cache: { day: number; stages: PipelineSeries[] } | null = null;

/** The three stages ending today. Rebuilt only when the UTC day turns, so every render shares one array. */
export function pipelineStages(): PipelineSeries[] {
  const now = new Date();
  const day = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  if (cache?.day !== day) cache = { day, stages: fakeFunnel(day) };
  return cache.stages;
}

export const PERIODS: PeriodOption[] = [
  { label: "Past 30 days", points: 30 },
  { label: "Past 90 days", points: 90 },
  { label: "Past 12 months", points: 365 },
];
