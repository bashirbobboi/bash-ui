"use client";
import type { PlaygroundSpec } from "../../types.ts";
import { FunnelChart } from "./funnel-chart";
import { stages } from "./fixtures";

export const playground: PlaygroundSpec = {
  component: "FunnelChart",
  controls: [
    { type: "number", name: "selectedIndex", label: "Highlighted stage", min: 0, max: 3, step: 1, default: 0 },
    { type: "boolean", name: "showPercentage", label: "Percentage pills", default: true },
    { type: "select", name: "edges", label: "Ribbon", options: ["curved", "straight"], default: "curved" },
  ],
  render: (values) => <FunnelChart data={stages} selectedIndex={Number(values.selectedIndex)} showPercentage={Boolean(values.showPercentage)} edges={values.edges as "curved" | "straight"} />,
  codeProps: ["data={stages}"],
};
