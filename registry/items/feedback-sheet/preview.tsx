"use client";

import { FeedbackSheet } from "./feedback-sheet.tsx";

export default function FeedbackSheetPreview() {
  return <FeedbackSheet inline linkLabel="View and suggest ideas?" onSubmit={() => new Promise((resolve) => setTimeout(resolve, 1500))} />;
}
