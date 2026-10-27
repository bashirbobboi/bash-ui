"use client";

import type { PlaygroundSpec } from "../../types.ts";
import { zones } from "./fixtures.ts";
import { ScoreGauge } from "./score-gauge.tsx";

export const playground: PlaygroundSpec = {
  component: "ScoreGauge",
  controls: [
    { type: "number", name: "value", label: "Value", min: 0, max: 1, step: 0.01, default: 0.78 },
    { type: "select", name: "size", label: "Size", options: ["full", "mini"], default: "full" },
    { type: "text", name: "label", label: "Label", default: "Priority" },
    { type: "text", name: "footnote", label: "Zone footnote", default: "" },
  ],
  render: (values) => (
    <ScoreGauge
      value={Number(values.value)}
      size={values.size as "full" | "mini"}
      label={String(values.label)}
      footnote={String(values.footnote)}
      zones={zones}
    />
  ),
  codeProps: ["zones={zones}"],
};
