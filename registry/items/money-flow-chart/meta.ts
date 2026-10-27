import type { ItemMeta } from "../../types.ts";
export const meta: ItemMeta = {
  "name": "money-flow-chart",
  "title": "Money flow chart",
  "kind": "pattern",
  "category": "charts",
  "type": "registry:block",
  "previewWidth": "full",
  "description": "Income ribbons converge on a pooled fund and flow out to spending, with year selection, hover tracing and pinned bands.",
  "whenToUse": "Use for balanced money flows through a shared pot. Each side must sum to total; include a surplus or reserves band to balance the year. It does not claim which source funded which activity.",
  "files": [
    "registry/items/money-flow-chart/money-flow-chart.tsx",
    "registry/items/money-flow-chart/fund-flow-types.ts",
    "registry/items/money-flow-chart/fund-flow-format.ts",
    "registry/items/money-flow-chart/fund-flow-media.ts"
  ],
  "dependencies": [
    "motion",
    "liquid-gooey"
  ],
  "registryDependencies": [
    "info-tooltip"
  ],
  "origin": {
    "project": "180Connect",
    "path": "src/app/(app)/clients/[id]/financials/fund-flow-sankey.tsx"
  },
  "credits": [
    {
      "name": "liquid-gooey",
      "url": "https://github.com/Jakubantalik/Libraries",
      "license": "MIT"
    }
  ],
  "props": [
    {
      "name": "flows",
      "type": "FundFlow[]",
      "description": "Balanced years with uniquely identified inflows and outflows, a shared total, and optional included amounts."
    },
    {
      "name": "animated",
      "type": "boolean",
      "description": "Replay the pour animation when changing years; honours reduced motion."
    },
    {
      "name": "showDetails",
      "type": "boolean",
      "description": "Show included amounts below the chart."
    }
  ]
};
