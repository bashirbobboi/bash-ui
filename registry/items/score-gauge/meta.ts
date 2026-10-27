import type { ItemMeta } from "../../types.ts";

export const meta: ItemMeta = {
  name: "score-gauge",
  title: "Score gauge",
  kind: "widget",
  category: "data-display",
  type: "registry:component",
  description:
    "A 0–1 score as an instrument gauge: a 250° comb of bars in a stop-to-go gradient, divided into named zones, with a tapered needle that springs in to the reading.",
  whenToUse:
    "Reach for it when one bounded score (priority, fit, health) needs to be read against its whole scale, at full size with per-zone explanations in a record header or as a mini dial on list cards. Not for unbounded numbers, trends over time, or comparing several scores side by side.",
  files: ["registry/items/score-gauge/score-gauge.tsx"],
  dependencies: ["motion"],
  registryDependencies: [],
  origin: {
    project: "180Connect",
    path: "src/app/(app)/clients/[id]/priority-dial.tsx (mini size from src/components/dashboard/priority-mini-dial.tsx; scale from src/lib/scoring/priority-scale.ts)",
  },
  credits: [],
  props: [
    { name: "value", type: "number | null", description: "The score, 0–1. Null draws the scale faded with no needle." },
    { name: "size", type: '"full" | "mini"', description: "full: 60 bars, scale numbers, readout table and zone explainers. mini: 24 bars and a two-line readout for cards. Default full." },
    { name: "label", type: "string", description: 'What the score is called in the readout and for screen readers. Default "Priority".' },
    { name: "zones", type: "ScoreGaugeZone[]", description: "The bands: { id, label, from, to, tone?, description?, detail? }. Default six tiers cut at 0.20 / 0.40 / 0.55 / 0.70 / 0.85." },
    { name: "readouts", type: "{ label: string; value: ReactNode }[]", description: 'Extra rows under the band in the full readout, e.g. "Parameters: 4 of 5".' },
    { name: "footnote", type: "string", description: "A closing line in every zone explainer. Full size only." },
    { name: "emptyLabel", type: "string", description: 'What to print with no score. Default "Not scored yet".' },
    { name: "onZoneSelect", type: "(zoneId: string | null) => void", description: "A zone was pinned by tap or Enter, or unpinned. Full size only." },
    { name: "className", type: "string", description: "Merged onto the outer element." },
  ],
};
