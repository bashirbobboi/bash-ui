import type { ItemMeta } from "../../types.ts";
export const meta: ItemMeta = {
  "name": "revenue-bar-chart",
  "title": "Revenue bar chart",
  "kind": "pattern",
  "category": "charts",
  "type": "registry:block",
  "description": "Monthly stacked revenue bars split between platform net and processing fees, with a toggle to include landlord payments.",
  "whenToUse": "Use to inspect platform revenue over time. The landlord toggle rescales to gross collections; each amount is integer kobo.",
  "files": [
    "registry/items/revenue-bar-chart/revenue-bar-chart.tsx"
  ],
  "dependencies": [
    "motion"
  ],
  "registryDependencies": [],
  "origin": {
    "project": "Ledge",
    "path": "src/components/admin/revenue-trend.tsx"
  },
  "credits": [],
  "props": [
    {
      "name": "data",
      "type": "MonthPoint[]",
      "description": "Month date, grossKobo, platformFeeKobo and paystackKobo."
    },
    {
      "name": "title",
      "type": "string",
      "description": "Section heading."
    },
    {
      "name": "defaultShowLandlords",
      "type": "boolean",
      "description": "Include landlord payments initially; the legend toggles them afterwards."
    },
    {
      "name": "animated",
      "type": "boolean",
      "description": "Animate bars on entering view; honours reduced motion."
    }
  ],
  "previewWidth": "full"
};
