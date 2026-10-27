"use client";

import type { PlaygroundSpec } from "../../types.ts";
import { FeedbackStage } from "./fixtures.tsx";

export const playground: PlaygroundSpec = {
  component: "FeedbackCard",
  controls: [
    { type: "text", name: "title", label: "Title", default: "How’s your experience?" },
    { type: "text", name: "description", label: "Description", default: "Rate your experience so far." },
    { type: "text", name: "submitLabel", label: "Send label", default: "Send feedback" },
    { type: "text", name: "dismissLabel", label: "Dismiss label", default: "Not now" },
    { type: "number", name: "autoCloseMs", label: "Thank-you stays (ms)", min: 0, max: 10000, step: 500, default: 5000 },
    { type: "number", name: "maxLength", label: "Comment limit", min: 20, max: 500, step: 10, default: 280 },
  ],
  render: (values) => (
    <FeedbackStage
      title={String(values.title)}
      description={String(values.description)}
      submitLabel={String(values.submitLabel)}
      dismissLabel={String(values.dismissLabel)}
      autoCloseMs={Number(values.autoCloseMs)}
      maxLength={Number(values.maxLength)}
    />
  ),
  codeProps: ["onSubmit={saveRating}", "onDismiss={snoozePrompt}"],
};
