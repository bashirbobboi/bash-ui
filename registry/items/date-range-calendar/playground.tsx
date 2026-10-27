"use client";

import type { PlaygroundSpec } from "../../types.ts";
import { DATA_END, DATA_START, PERIOD_LABELS, PeriodPicker, isoDayOrNull } from "./fixtures.tsx";

export const playground: PlaygroundSpec = {
  component: "DateRangePicker",
  controls: [
    { type: "select", name: "value", label: "Selected period", options: PERIOD_LABELS, default: PERIOD_LABELS[0] },
    // The component defaults this to false; on here because the calendar is the point of the item.
    { type: "boolean", name: "allowCustomRange", label: "Custom range", default: true },
    { type: "text", name: "rangeMin", label: "Earliest day", default: DATA_START },
    { type: "text", name: "rangeMax", label: "Latest day", default: DATA_END },
  ],
  render: (values) => (
    <PeriodPicker
      // A new selected period starts the picker over from that option.
      key={String(values.value)}
      initial={String(values.value)}
      allowCustomRange={Boolean(values.allowCustomRange)}
      rangeMin={isoDayOrNull(values.rangeMin)}
      rangeMax={isoDayOrNull(values.rangeMax)}
    />
  ),
  codeProps: ["options={periods}", "onChange={setPeriod}", "defaultOption={periods[0]}"],
};
