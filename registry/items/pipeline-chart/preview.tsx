"use client";

import { PERIODS, pipelineStages } from "./fixtures.ts";
import { PipelineChart } from "./pipeline-chart.tsx";

export default function PipelineChartPreview() {
  return (
    <div className="w-full max-w-[560px]">
      <PipelineChart
        title="Contacted, replied, converted"
        subtitle="Clients reached at each stage"
        unit="clients"
        series={pipelineStages()}
        periodOptions={PERIODS}
        allowCustomRange
      />
    </div>
  );
}
