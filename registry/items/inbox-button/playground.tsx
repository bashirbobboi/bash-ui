"use client";

import type { PlaygroundSpec } from "../../types.ts";
import { InboxButton } from "./inbox-button.tsx";

export const playground: PlaygroundSpec = {
  component: "InboxButton",
  controls: [
    { type: "text", name: "label", label: "Label", default: "View inbox" },
    { type: "number", name: "unreadCount", label: "Unread", min: 0, max: 150, step: 1, default: 0 },
    { type: "number", name: "maxCount", label: "Most shown before +", min: 9, max: 99, step: 1, default: 99 },
  ],
  render: (values) => (
    <InboxButton
      label={String(values.label)}
      unreadCount={Number(values.unreadCount)}
      maxCount={Number(values.maxCount)}
    />
  ),
  codeProps: ['href="/inbox"'],
};
