"use client";

import type { PlaygroundSpec } from "../../types.ts";
import { NotificationToggle } from "./notification-toggle.tsx";

export const playground: PlaygroundSpec = {
  component: "NotificationToggle",
  controls: [
    { type: "boolean", name: "defaultChecked", label: "Starts on", default: false },
    { type: "boolean", name: "disabled", label: "Disabled", default: false },
    { type: "text", name: "aria-label", label: "Accessible name", default: "SMS notifications" },
  ],
  render: (values) => (
    <NotificationToggle
      key={String(values.defaultChecked)}
      defaultChecked={Boolean(values.defaultChecked)}
      disabled={Boolean(values.disabled)}
      aria-label={String(values["aria-label"])}
    />
  ),
};
