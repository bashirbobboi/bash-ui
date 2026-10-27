"use client";

import type { PlaygroundSpec } from "../../types.ts";
import { FeedbackSheet } from "./feedback-sheet.tsx";

export const playground: PlaygroundSpec = {
  component: "FeedbackSheet",
  controls: [
    { type: "text", name: "title", label: "Title", default: "" },
    { type: "text", name: "placeholder", label: "Placeholder", default: "Share your thoughts…" },
    { type: "text", name: "submitLabel", label: "Submit label", default: "Submit Feedback" },
    { type: "text", name: "linkLabel", label: "Link", default: "View and suggest ideas?" },
    { type: "number", name: "maxLength", label: "Max length", min: 100, max: 2000, step: 100, default: 1000 },
  ],
  render: (values) => (
    <FeedbackSheet
      inline
      title={String(values.title) || undefined}
      placeholder={String(values.placeholder)}
      submitLabel={String(values.submitLabel)}
      linkLabel={String(values.linkLabel) || undefined}
      maxLength={Number(values.maxLength)}
      onSubmit={() => new Promise((resolve) => setTimeout(resolve, 1500))}
    />
  ),
  codeProps: ["open={open}", "onOpenChange={setOpen}", "onSubmit={sendFeedback}", "onLinkClick={openIdeasBoard}"],
};
