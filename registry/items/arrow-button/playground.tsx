"use client";

import type { PlaygroundSpec } from "../../types.ts";
import {
  ArrowButton,
  type ArrowButtonSize,
  type ArrowButtonVariant,
} from "./arrow-button.tsx";

export const playground: PlaygroundSpec = {
  component: "ArrowButton",
  controls: [
    { type: "text", name: "label", label: "Label", default: "Download Now" },
    { type: "select", name: "variant", label: "Variant", options: ["solid", "outline"], default: "solid" },
    { type: "select", name: "size", label: "Size", options: ["sm", "md", "lg"], default: "md" },
    { type: "boolean", name: "disabled", label: "Disabled", default: false },
  ],
  render: (values) => (
    <ArrowButton
      label={String(values.label)}
      variant={values.variant as ArrowButtonVariant}
      size={values.size as ArrowButtonSize}
      disabled={Boolean(values.disabled)}
    />
  ),
  codeProps: ["onClick={download}"],
};
