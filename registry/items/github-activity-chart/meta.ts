import type { ItemMeta } from "../../types.ts";
export const meta: ItemMeta = {
  "name": "github-activity-chart",
  "title": "GitHub activity chart",
  "kind": "pattern",
  "category": "charts",
  "type": "registry:block",
  "description": "A watercolour contribution calendar with painted cells, subtle splatters, day inspection and a five-level activity legend.",
  "whenToUse": "Use for dated activity counts. Supply contribution data from any source; this component performs no requests. The preview uses deterministic example data, not a live GitHub account.",
  "files": [
    "registry/items/github-activity-chart/github-activity-chart.tsx",
    "registry/items/github-activity-chart/contribution-calendar.ts"
  ],
  "origin": {
    "project": "Portfolio",
    "path": "src/components/github-chart.tsx"
  },
  "credits": [],
  "props": [
    {
      "name": "data",
      "type": "ContributionDay[]",
      "description": "ISO calendar dates, contribution counts and intensity levels 0\u20134."
    },
    {
      "name": "label",
      "type": "string",
      "description": "Caption following the optional total."
    },
    {
      "name": "watercolor",
      "type": "boolean",
      "description": "Enable painted cells and splatters."
    },
    {
      "name": "showTotal",
      "type": "boolean",
      "description": "Show the contribution total."
    },
    {
      "name": "showLegend",
      "type": "boolean",
      "description": "Show the five-level legend."
    },
    {
      "name": "onDaySelect",
      "type": "(day: ContributionDay) => void",
      "description": "Called when a day is activated."
    }
  ],
  "dependencies": [
    "motion"
  ],
  "previewWidth": "full"
};
