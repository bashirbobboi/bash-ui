"use client";

import type { PlaygroundSpec } from "../../types.ts";
import { PRIORITY_SEGMENTS, PRIORITY_TOTAL } from "./fixtures.ts";
import { BreakdownDial } from "./breakdown-dial.tsx";

export const playground: PlaygroundSpec = {
  component: "BreakdownDial",
  controls: [
    { type: "text", name: "title", label: "Title", default: "Queue quality" },
    { type: "text", name: "totalLabel", label: "Centre label", default: "Total" },
    // The card's own default is the segments' sum; 0 shows the empty state.
    { type: "number", name: "total", label: "Total", min: 0, max: 8000, step: 1, default: PRIORITY_TOTAL },
    { type: "text", name: "emptyTitle", label: "Empty title", default: "Nothing in the queue yet" },
  ],
  render: (values) => (
    <div className="w-full max-w-[360px]">
      <BreakdownDial
        segments={PRIORITY_SEGMENTS}
        title={String(values.title)}
        totalLabel={String(values.totalLabel)}
        total={Number(values.total)}
        emptyTitle={String(values.emptyTitle)}
      />
    </div>
  ),
  codeProps: ["segments={segments}"],
};
