"use client";

import { RangeSlider } from "./range-slider.tsx";
import {
  INCOME_HISTOGRAM,
  INCOME_RANGE,
  INCOME_STOPS,
  formatIncome,
  incomeBarLabel,
} from "./fixtures.ts";

export default function RangeSliderPreview() {
  return (
    <div className="w-full max-w-[460px]">
      <RangeSlider
        className="px-0"
        stops={INCOME_STOPS}
        defaultValue={INCOME_RANGE}
        data={INCOME_HISTOGRAM}
        barLabel={incomeBarLabel}
        formatValue={formatIncome}
      />
    </div>
  );
}
