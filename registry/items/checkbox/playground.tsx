"use client";

import type { PlaygroundSpec } from "../../types.ts";
import { Checkbox } from "./checkbox.tsx";

type Size = "sm" | "default" | "lg";

export const playground: PlaygroundSpec = {
  component: "Checkbox",
  controls: [
    { type: "select", name: "size", label: "Size", options: ["sm", "default", "lg"], default: "sm" },
    { type: "boolean", name: "defaultChecked", label: "Starts ticked", default: false },
    { type: "boolean", name: "disabled", label: "Disabled", default: false },
    { type: "boolean", name: "aria-invalid", label: "Invalid", default: false },
  ],
  render: (values) => (
    <Checkbox
      // A new starting state only shows on a fresh mount.
      key={String(values.defaultChecked)}
      aria-label="Include charity register"
      size={values.size as Size}
      defaultChecked={Boolean(values.defaultChecked)}
      disabled={Boolean(values.disabled)}
      aria-invalid={Boolean(values["aria-invalid"]) || undefined}
    />
  ),
  codeProps: ['id="charity-register"', "onCheckedChange={setIncluded}"],
};
