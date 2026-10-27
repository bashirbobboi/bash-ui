"use client";
import type { PlaygroundSpec } from "../../types.ts";
import { IncomeSpendingChart } from "./income-spending-chart";
import { years } from "./fixtures";
export const playground: PlaygroundSpec = {
  component: "IncomeSpendingChart",
  controls: [
    { type: "boolean", name: "showOverview", label: "Trend strip", default: true },
    { type: "boolean", name: "animated", label: "Animate bars", default: true },
  ],
  render: (values) => <IncomeSpendingChart years={years} showOverview={Boolean(values.showOverview)} animated={Boolean(values.animated)} />,
  codeProps: ["years={years}"],
};
