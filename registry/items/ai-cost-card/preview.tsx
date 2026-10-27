"use client";

import { AiCostCard } from "./ai-cost-card.tsx";
import { categories, readings } from "./fixtures.ts";

export default function AiCostCardPreview() {
  return (
    <div className="w-full max-w-[560px]">
      <AiCostCard readings={readings} categories={categories} defaultReadingId="30d" />
    </div>
  );
}
