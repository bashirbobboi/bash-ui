"use client";

import { useState } from "react";

import { DateRangePicker, type PeriodOption } from "./date-range-picker.tsx";

/** Fake data and a stateful stand-in for the caller, for the preview and the playground. Not shipped. */

export const PERIODS: PeriodOption[] = [
  { label: "Past 30 days", points: 30 },
  { label: "Past 90 days", points: 90 },
  { label: "Past 12 months", points: 365 },
];

export const PERIOD_LABELS = PERIODS.map((period) => period.label);

function isoDaysAgo(days: number): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - days))
    .toISOString()
    .slice(0, 10);
}

/** The days a chart would hold: the past year, so the calendar greys out the rest. */
export const DATA_START = isoDaysAgo(364);
export const DATA_END = isoDaysAgo(0);

/** A typed bound, or null when it is not a real YYYY-MM-DD day. */
export function isoDayOrNull(value: unknown): string | null {
  const text = String(value).trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) && !Number.isNaN(Date.parse(text)) ? text : null;
}

/** Holds the chosen period the way a chart card would. */
export function PeriodPicker({
  initial = PERIODS[0].label,
  allowCustomRange = true,
  rangeMin = DATA_START,
  rangeMax = DATA_END,
}: {
  initial?: string;
  allowCustomRange?: boolean;
  rangeMin?: string | null;
  rangeMax?: string | null;
}) {
  const [period, setPeriod] = useState(initial);
  return (
    <DateRangePicker
      value={period}
      options={PERIODS}
      onChange={(option) => setPeriod(option.label)}
      allowCustomRange={allowCustomRange}
      defaultOption={PERIODS[0]}
      rangeMin={rangeMin}
      rangeMax={rangeMax}
    />
  );
}
