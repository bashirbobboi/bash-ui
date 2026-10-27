"use client";

import type { PlaygroundSpec } from "../../types.ts";
import { StickProgressBar } from "./stick-progress-bar.tsx";

export const playground: PlaygroundSpec = {
  component: "StickProgressBar",
  controls: [
    { type: "number", name: "checked", label: "Checked", min: 0, max: 400, step: 1, default: 148 },
    { type: "number", name: "total", label: "Total", min: 10, max: 400, step: 10, default: 200 },
    {
      type: "select",
      name: "activeColor",
      label: "Colour",
      options: [
        { value: "var(--lead)", label: "Lead" },
        { value: "var(--go)", label: "Go" },
        { value: "var(--hold)", label: "Hold" },
        { value: "var(--stop)", label: "Stop" },
      ],
      default: "var(--lead)",
    },
    { type: "number", name: "pitch", label: "Pitch", min: 4, max: 16, step: 0.5, default: 8.5 },
    { type: "number", name: "stickWidth", label: "Stick width", min: 1, max: 8, step: 0.5, default: 3 },
    { type: "number", name: "stickHeight", label: "Stick height", min: 4, max: 40, step: 1, default: 16 },
  ],
  render: (values) => (
    <div className="w-full max-w-[420px]">
      <StickProgressBar
        checked={Number(values.checked)}
        total={Number(values.total)}
        activeColor={String(values.activeColor)}
        pitch={Number(values.pitch)}
        stickWidth={Number(values.stickWidth)}
        stickHeight={Number(values.stickHeight)}
        checkedLabel="Sent today"
        remainingLabel="Remaining"
        ariaLabel="Emails sent today against the daily limit"
      />
    </div>
  ),
  codeProps: ['checkedLabel="Sent today"', 'remainingLabel="Remaining"'],
};
