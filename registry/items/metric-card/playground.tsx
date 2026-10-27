"use client";

import type { PlaygroundSpec } from "../../types.ts";
import { emailsSent, PERIODS } from "./fixtures.ts";
import { MetricCard, type CardSize, type ChartView, type MetricAccent } from "./metric-card.tsx";

export const playground: PlaygroundSpec = {
  component: "MetricCard",
  controls: [
    { type: "select", name: "size", label: "Size", options: ["sm", "md", "lg"], default: "md" },
    {
      type: "select",
      name: "accent",
      label: "Accent",
      options: ["go", "stop", "neutral", "brand", "lead"],
      default: "go",
    },
    { type: "select", name: "defaultView", label: "View", options: ["curve", "bars"], default: "curve" },
    { type: "boolean", name: "fullWidth", label: "Full-width chart", default: false },
    { type: "boolean", name: "showAxes", label: "Axes", default: false },
    { type: "boolean", name: "loading", label: "Loading", default: false },
  ],
  render: (values) => (
    <div className="w-full max-w-[560px]">
      <MetricCard
        // The view is starting state, so a new one needs a fresh card.
        key={String(values.defaultView)}
        title="Emails sent"
        unit="emails"
        data={emailsSent()}
        periodOptions={PERIODS}
        deltaLabel="vs yesterday"
        size={values.size as CardSize}
        accent={values.accent as MetricAccent}
        defaultView={values.defaultView as ChartView}
        fullWidth={Boolean(values.fullWidth)}
        showAxes={Boolean(values.showAxes)}
        loading={Boolean(values.loading)}
      />
    </div>
  ),
  codeProps: ['title="Emails sent"', "data={emailsSent}", "periodOptions={periods}"],
};
