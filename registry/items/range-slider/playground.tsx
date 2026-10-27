"use client";

import type { PlaygroundSpec } from "../../types.ts";
import { RangeSlider } from "./range-slider.tsx";
import {
  INCOME_HISTOGRAM,
  INCOME_RANGE,
  INCOME_STOPS,
  formatIncome,
  incomeBarLabel,
} from "./fixtures.ts";

export const playground: PlaygroundSpec = {
  component: "RangeSlider",
  controls: [
    { type: "select", name: "colorScheme", label: "Colour", options: ["ramp", "primary"], default: "ramp" },
    { type: "boolean", name: "showHistogram", label: "Histogram", default: true },
    { type: "boolean", name: "showReadout", label: "Readout", default: true },
    { type: "text", name: "minLabel", label: "Minimum label", default: "Minimum" },
    { type: "text", name: "maxLabel", label: "Maximum label", default: "Maximum" },
    { type: "boolean", name: "disabled", label: "Disabled", default: false },
  ],
  render: (values) => (
    <div className="w-full max-w-[460px]">
      <RangeSlider
        className="px-0"
        stops={INCOME_STOPS}
        defaultValue={INCOME_RANGE}
        data={INCOME_HISTOGRAM}
        barLabel={incomeBarLabel}
        formatValue={formatIncome}
        colorScheme={values.colorScheme as "ramp" | "primary"}
        showHistogram={Boolean(values.showHistogram)}
        showReadout={Boolean(values.showReadout)}
        minLabel={String(values.minLabel)}
        maxLabel={String(values.maxLabel)}
        disabled={Boolean(values.disabled)}
      />
    </div>
  ),
  codeProps: ["stops={incomeStops}", "data={histogram}", "formatValue={formatIncome}", "onValueCommit={setIncome}"],
};
