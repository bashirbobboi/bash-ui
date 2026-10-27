"use client";

import type { PlaygroundSpec } from "../../types.ts";
import { PERIODS, pipelineStages } from "./fixtures.ts";
import { PipelineChart, type ChartView } from "./pipeline-chart.tsx";

export const playground: PlaygroundSpec = {
  component: "PipelineChart",
  controls: [
    { type: "text", name: "title", label: "Title", default: "Contacted, replied, converted" },
    { type: "text", name: "subtitle", label: "Subtitle", default: "Clients reached at each stage" },
    { type: "text", name: "unit", label: "Axis unit", default: "clients" },
    {
      type: "select",
      name: "period",
      label: "Opening period",
      options: PERIODS.map((option) => option.label),
      default: "Past 30 days",
    },
    { type: "select", name: "defaultView", label: "View", options: ["curve", "bars"], default: "curve" },
    { type: "boolean", name: "allowCustomRange", label: "Custom range", default: false },
  ],
  render: (values) => (
    <div className="w-full max-w-[560px]">
      <PipelineChart
        // Period and view are starting state, so a new one needs a fresh chart.
        key={`${values.period}:${values.defaultView}`}
        title={String(values.title)}
        subtitle={String(values.subtitle)}
        unit={String(values.unit)}
        period={String(values.period)}
        defaultView={values.defaultView as ChartView}
        allowCustomRange={Boolean(values.allowCustomRange)}
        series={pipelineStages()}
        periodOptions={PERIODS}
      />
    </div>
  ),
  codeProps: ["series={stages}", "periodOptions={periods}"],
};
