import type { ItemMeta } from "../../types.ts";
export const meta: ItemMeta = {
  "name": "income-spending-chart",
  "title": "Income vs spending chart",
  "kind": "pattern",
  "category": "charts",
  "type": "registry:block",
  "previewWidth": "full",
  "description": "A financial history chart with a smooth trend strip, paired segmented bars, signed net results and year tooltips.",
  "whenToUse": "Use to compare income and spending across filed years. Missing amounts remain distinct from zero; net results have a separate scale.",
  "files": [
    "registry/items/income-spending-chart/income-spending-chart.tsx",
    "registry/items/income-spending-chart/financial-history-format.ts",
    "registry/items/income-spending-chart/financial-history-parts.tsx",
    "registry/items/income-spending-chart/financial-history-types.ts",
    "registry/items/income-spending-chart/timeline-overview-scrubber.tsx",
    "registry/items/income-spending-chart/financial-history-math.ts"
  ],
  "dependencies": [
    "motion"
  ],
  "registryDependencies": [],
  "origin": {
    "project": "180Connect",
    "path": "src/app/(app)/clients/[id]/financials/financial-history-chart.tsx"
  },
  "credits": [],
  "props": [
    {
      "name": "years",
      "type": "FinancialYear[]",
      "description": "Ordered years: label, periodEnd, income, expenditure and net. Amounts may be null when unknown."
    },
    {
      "name": "showOverview",
      "type": "boolean",
      "description": "Show the Income / Net result trend strip."
    },
    {
      "name": "animated",
      "type": "boolean",
      "description": "Animate segmented bars on entering view; honours reduced motion."
    }
  ]
};
