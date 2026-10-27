import type { ItemMeta } from "../../types.ts";
export const meta: ItemMeta = {
  "name": "donut-chart",
  "title": "Donut chart",
  "kind": "pattern",
  "category": "charts",
  "type": "registry:block",
  "description": "Ledge\u2019s collection doughnut paired with exact amounts and percentages on the right, plus linked slice and legend highlights.",
  "whenToUse": "Use to show how collected money is divided. Pass integer kobo and ensure landlord net + platform retained + processing fees equals gross.",
  "files": [
    "registry/items/donut-chart/donut-chart.tsx"
  ],
  "dependencies": [
    "motion"
  ],
  "registryDependencies": [],
  "origin": {
    "project": "Ledge",
    "path": "src/components/admin/collection-breakdown.tsx"
  },
  "credits": [],
  "props": [
    {
      "name": "grossKobo / landlordNetKobo / ledgeKobo / paystackKobo",
      "type": "number",
      "description": "Gross and its three non-overlapping allocations, in integer kobo."
    },
    {
      "name": "title",
      "type": "string",
      "description": "Section heading."
    },
    {
      "name": "platformLabel / processingLabel",
      "type": "string",
      "description": "Labels for the two fee allocations."
    },
    {
      "name": "animated",
      "type": "boolean",
      "description": "Draw the ring on mount; honours reduced motion."
    }
  ],
  "previewWidth": "full"
};
