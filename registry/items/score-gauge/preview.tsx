"use client";

import { zones } from "./fixtures.ts";
import { ScoreGauge } from "./score-gauge.tsx";

export default function ScoreGaugePreview() {
  return <ScoreGauge value={0.78} zones={zones} />;
}
