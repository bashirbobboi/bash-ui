import type { ItemMeta } from "../../types.ts";

export const meta: ItemMeta = {
  name: "breakdown-dial",
  title: "Breakdown dial",
  kind: "widget",
  category: "charts",
  type: "registry:component",
  description:
    "A card with a 270° dial of 42 ticks split between a few groups, the total in its centre, and a row per group with its count and share; hovering a group isolates its ticks.",
  whenToUse:
    "Use to show how one whole divides into three to five ranked groups (priority bands, statuses) at a glance, with the exact counts beside it. Not for values over time or for more than about five groups; use a chart or a list for those.",
  files: ["registry/items/breakdown-dial/breakdown-dial.tsx"],
  dependencies: ["motion", "lucide-react"],
  registryDependencies: [],
  origin: {
    project: "180Connect",
    path: "src/components/dashboard/queue-quality-card.tsx",
  },
  credits: [],
  props: [
    {
      name: "segments",
      type: "{ id: string; label: string; value: number; color?: string }[]",
      description:
        "The groups, best first. Every group keeps a row (0% when empty); only groups above zero get ticks. Colours default to ink, dim, faint, rule.",
    },
    {
      name: "total",
      type: "number",
      description: "Centre figure and base for each share. Defaults to the sum of the segments.",
    },
    { name: "title", type: "ReactNode", description: 'Card heading. Default "Queue quality".' },
    { name: "icon", type: "LucideIcon", description: "Header and centre icon. Default Target." },
    { name: "totalLabel", type: "string", description: 'Word above the centre figure. Default "Total".' },
    {
      name: "valueFormatter",
      type: "(value: number) => string",
      description: "Formats counts in the rows, centre and tooltip.",
    },
    {
      name: "emptyTitle / emptyDescription",
      type: "string",
      description: "Copy shown when the total is zero.",
    },
  ],
};
