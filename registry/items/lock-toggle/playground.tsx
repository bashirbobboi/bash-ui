"use client";

import type { PlaygroundSpec } from "../../types.ts";
import { LockToggle, type LockToggleSize, type LockToggleTone } from "./lock-toggle.tsx";

export const playground: PlaygroundSpec = {
  component: "LockToggle",
  controls: [
    { type: "select", name: "tone", label: "Tone", options: ["stop", "go", "lead"], default: "stop" },
    { type: "select", name: "size", label: "Size", options: ["md", "sm"], default: "md" },
    { type: "boolean", name: "showIcons", label: "Lock icons", default: true },
    { type: "boolean", name: "defaultChecked", label: "Starts on", default: false },
    { type: "boolean", name: "disabled", label: "Disabled", default: false },
    { type: "select", name: "haptic", label: "Click sound", options: ["none", "light", "heavy"], default: "none" },
  ],
  render: (values) => (
    <LockToggle
      // A new starting state only shows on a fresh mount.
      key={String(values.defaultChecked)}
      aria-label="Trustee names protection"
      tone={values.tone as LockToggleTone}
      size={values.size as LockToggleSize}
      showIcons={Boolean(values.showIcons)}
      defaultChecked={Boolean(values.defaultChecked)}
      disabled={Boolean(values.disabled)}
      haptic={values.haptic as "none" | "light" | "heavy"}
    />
  ),
  codeProps: ['aria-label="Trustee names protection"', "onCheckedChange={setProtected}"],
};
