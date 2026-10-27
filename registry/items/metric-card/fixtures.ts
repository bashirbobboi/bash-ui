import type { PeriodOption, SeriesPoint } from "./metric-card.tsx";

/*
 * Fake data for the preview and the playground. Not shipped.
 */

const DAY_MS = 86_400_000;
const DAYS = 60;

/** Small deterministic PRNG so server and client draw the same numbers. */
function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) % 4_294_967_296;
    return state / 4_294_967_296;
  };
}

function isoDaysBack(days: number, end: number) {
  return Array.from({ length: days }, (_, i) => new Date(end - (days - 1 - i) * DAY_MS).toISOString().slice(0, 10));
}

/**
 * Sixty days of outreach emails: a slow wave, a dip every weekend, some noise.
 * The seed fixes the values; only the dates move with today.
 */
function buildSent(end: number): SeriesPoint[] {
  const rand = seeded(180);
  return isoDaysBack(DAYS, end).map((date, i) => ({
    date,
    value: Math.max(0, Math.round(14 + Math.sin(i / 3) * 6 + rand() * 8 + (i % 7 >= 5 ? -10 : 0))),
  }));
}

let cache: { day: number; sent: SeriesPoint[] } | null = null;

/** The series ending today. Rebuilt only when the UTC day turns, so every render shares one array. */
export function emailsSent(): SeriesPoint[] {
  const now = new Date();
  const day = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  if (cache?.day !== day) cache = { day, sent: buildSent(day) };
  return cache.sent;
}

export const PERIODS: PeriodOption[] = [
  { label: "Past 7 days", points: 7 },
  { label: "Past 30 days", points: 30 },
  { label: "Past 60 days" },
];
