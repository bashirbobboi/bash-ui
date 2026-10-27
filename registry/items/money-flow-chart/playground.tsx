"use client";
import type { PlaygroundSpec } from "../../types.ts";
import { MoneyFlowChart } from "./money-flow-chart";
import { flows } from "./fixtures";
export const playground: PlaygroundSpec = {
  component: "MoneyFlowChart",
  controls: [
    { type: "boolean", name: "animated", label: "Animate the flow", default: true },
    { type: "boolean", name: "showDetails", label: "Included amounts", default: true },
  ],
  render: (values) => <MoneyFlowChart flows={flows} animated={Boolean(values.animated)} showDetails={Boolean(values.showDetails)} />,
  codeProps: ["flows={flows}"],
};
