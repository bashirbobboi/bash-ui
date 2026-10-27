"use client";

import { StickProgressBar, type StickProgressSegment } from "./stick-progress-bar.tsx";

/** Where each pound of a charity's spending goes. */
const SEGMENTS: StickProgressSegment[] = [
  {
    id: "charitable",
    label: "Direct cause & services",
    value: 78,
    color: "var(--go)",
    hoverColor: "color-mix(in oklab, var(--go) 85%, var(--ink))",
  },
  {
    id: "fundraising",
    label: "Raising funds",
    value: 14,
    color: "var(--hold)",
    hoverColor: "color-mix(in oklab, var(--hold) 85%, var(--card))",
  },
  { id: "governance", label: "Governance & support", value: 6, color: "var(--lead-mid)", hoverColor: "var(--lead)" },
  { id: "other", label: "Other", value: 2, color: "var(--rule)", hoverColor: "var(--dim)" },
];

export default function StickProgressBarPreview() {
  return (
    <div className="w-full max-w-[420px]">
      <StickProgressBar
        segments={SEGMENTS}
        valueFormatter={(v) => `${v}p in £1`}
        ariaLabel="Where each pound is spent"
      />
    </div>
  );
}
