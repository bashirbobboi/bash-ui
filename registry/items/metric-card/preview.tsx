"use client";

import { emailsSent, PERIODS } from "./fixtures.ts";
import { MetricCard } from "./metric-card.tsx";

export default function MetricCardPreview() {
  return (
    <div className="w-full max-w-[560px]">
      <MetricCard
        title="Emails sent"
        unit="emails"
        data={emailsSent()}
        periodOptions={PERIODS}
        deltaLabel="vs yesterday"
        allowCustomRange
      />
    </div>
  );
}
