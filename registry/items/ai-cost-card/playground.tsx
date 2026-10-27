"use client";

import type { PlaygroundSpec } from "../../types.ts";
import { AiCostCard } from "./ai-cost-card.tsx";
import { categories, readings } from "./fixtures.ts";

export const playground: PlaygroundSpec = {
  component: "AiCostCard",
  controls: [
    { type: "text", name: "title", label: "Title", default: "Estimated AI cost" },
    {
      type: "select",
      name: "defaultReadingId",
      label: "Starting window",
      options: readings.map((reading) => reading.id),
      default: "30d",
    },
    {
      type: "text",
      name: "estimateNote",
      label: "Estimate note",
      default:
        "What this use would cost at the provider’s standard paid rates. On a free tier, the actual bill can be $0.",
    },
    { type: "text", name: "linkLabel", label: "Link text", default: "View all generations" },
  ],
  render: (values) => (
    <div className="w-full max-w-[560px]">
      <AiCostCard
        // The starting window is read once, on mount.
        key={String(values.defaultReadingId)}
        readings={readings}
        categories={categories}
        title={String(values.title)}
        defaultReadingId={String(values.defaultReadingId)}
        estimateNote={String(values.estimateNote)}
        linkLabel={String(values.linkLabel)}
        href="#generations"
      />
    </div>
  ),
  codeProps: ["readings={readings}", "categories={categories}", 'href="/generations"'],
};
