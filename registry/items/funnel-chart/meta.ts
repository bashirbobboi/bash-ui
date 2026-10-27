import type { ItemMeta } from "../../types.ts";
export const meta: ItemMeta = {
  previewWidth: "full",
  name: "funnel-chart", title: "Funnel chart", kind: "pattern", category: "charts", type: "registry:block",
  description: "Pipeline stage totals above a pale curved funnel, with vertical guides and percentage pills.",
  whenToUse: "Use to show how a starting population progresses through ordered stages. Percentages on the ribbon compare with the first stage; summary percentages compare with the previous stage.",
  files: ["registry/items/funnel-chart/funnel-chart.tsx"],
  origin: { project: "180Connect", path: "src/components/ui/funnel-chart.tsx; src/app/(app)/clients/pipeline-report.tsx" }, credits: [],
  props: [
    { name: "data", type: "readonly FunnelStage[]", description: "Stages with label, value and optional caption." },
    { name: "selectedIndex", type: "number", description: "Highlighted stage; defaults to the first." },
    { name: "onStageChange", type: "(index: number) => void", description: "Makes stage summaries selectable. Omit for a read-only report." },
    { name: "showPercentage", type: "boolean", description: "Show share-of-first percentage pills." },
    { name: "edges", type: '"curved" | "straight"', description: "Shape of the transitions between stages." },
    { name: "footer", type: "ReactNode", description: "Optional breakdown caption or consumer-supplied sorting controls." },
    { name: "className", type: "string", description: "Additional classes for the report." },
  ],
};
