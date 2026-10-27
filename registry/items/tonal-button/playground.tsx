"use client";

import type { PlaygroundSpec } from "../../types.ts";
import { TonalButton } from "./tonal-button.tsx";

export const playground: PlaygroundSpec = {
  component: "TonalButton",
  controls: [
    { type: "text", name: "label", label: "Label", default: "Earnings" },
    {
      type: "select",
      name: "tone",
      label: "Tone",
      options: [
        { value: "tonal", label: "Tonal" },
        { value: "secondary", label: "Secondary" },
      ],
      default: "tonal",
    },
    { type: "boolean", name: "disabled", label: "Disabled", default: false },
  ],
  render: (values) => (
    <TonalButton
      label={String(values.label)}
      tone={values.tone as "tonal" | "secondary"}
      disabled={Boolean(values.disabled)}
    />
  ),
  codeProps: ["onClick={openEarnings}"],
};
