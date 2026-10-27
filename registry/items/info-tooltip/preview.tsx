"use client";

import { InfoTooltip } from "./info-tooltip.tsx";

export default function InfoTooltipPreview() {
  return (
    <InfoTooltip
      title="Annual income"
      content="Total income from the most recent accounts filed with the regulator."
      footer="Source: charity register, year ending March 2026"
    />
  );
}
