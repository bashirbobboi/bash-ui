"use client";

import type { PlaygroundSpec } from "../../types.ts";
import { SendButton } from "./send-button.tsx";

export const playground: PlaygroundSpec = {
  component: "SendButton",
  controls: [
    { type: "text", name: "label", label: "Label", default: "Send" },
    { type: "select", name: "tone", label: "Tone", options: ["ink", "lead"], default: "ink" },
    { type: "select", name: "radius", label: "Shape", options: ["pill", "lg"], default: "pill" },
    { type: "boolean", name: "pending", label: "Pending", default: false },
    { type: "boolean", name: "disabled", label: "Disabled", default: false },
  ],
  render: (values) => (
    <SendButton
      label={String(values.label)}
      tone={values.tone as "ink" | "lead"}
      radius={values.radius as "pill" | "lg"}
      pending={Boolean(values.pending)}
      disabled={Boolean(values.disabled)}
    />
  ),
  codeProps: ["onClick={send}"],
};
