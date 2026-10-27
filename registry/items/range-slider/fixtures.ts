/**
 * Fake data for the preview and the playground. Not shipped.
 *
 * A non-linear income scale: fine where a difference changes the kind of
 * organisation (£10k vs £25k), coarse past £1m where it hardly matters. The
 * last stop reads "£10m+", meaning no upper limit.
 */
export const INCOME_STOPS = [
  0, 5_000, 10_000, 25_000, 50_000, 75_000, 100_000, 150_000, 250_000, 350_000,
  500_000, 750_000, 1_000_000, 1_500_000, 2_500_000, 5_000_000, 10_000_000,
] as const;

const TOP = INCOME_STOPS[INCOME_STOPS.length - 1];

export const INCOME_RANGE: [number, number] = [25_000, 1_000_000];

export function formatIncome(value: number): string {
  if (value >= TOP) return "£10m+";
  if (value === 0) return "£0";
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    return `£${Number.isInteger(millions) ? millions : millions.toFixed(2).replace(/\.?0+$/, "")}m`;
  }
  if (value >= 1_000) return `£${Math.round(value / 1_000)}k`;
  return `£${value}`;
}

/** A made-up distribution: many small organisations, a dip, then a long tail. */
export const INCOME_HISTOGRAM = Array.from({ length: 48 }, (_, i) => {
  const x = i / 47;
  return 0.42 + 0.58 * Math.exp(-x * 4) + 0.35 * Math.max(0, x - 0.6) ** 2 * 4;
});

const COUNTS = INCOME_HISTOGRAM.map((h) => Math.round(h * 3_400));

export const incomeBarLabel = (index: number) => `${COUNTS[index].toLocaleString()} charities`;
