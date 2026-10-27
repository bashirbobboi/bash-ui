import type { ItemMeta } from "../../types.ts";

export const meta: ItemMeta = {
  name: "metric-card",
  title: "Metric card",
  kind: "widget",
  category: "charts",
  type: "registry:component",
  description:
    "A headline metric card with a smooth line (or bar) chart washed into its right side, a trend badge coloured by direction, a line/bar toggle, and a period dropdown with an optional custom-range calendar.",
  whenToUse:
    "Use for one headline number that moves over time (a total, a daily count) where the reader wants the figure first and the shape second, with hover to read any day. Not for comparing many categories or for a table of figures; use a bar chart or a list for those.",
  files: [
    "registry/items/metric-card/metric-card.tsx",
    "registry/items/metric-card/metric-chart.tsx",
    "registry/items/metric-card/metric-controls.tsx",
  ],
  dependencies: ["motion", "lucide-react"],
  registryDependencies: ["date-range-calendar"],
  origin: {
    project: "180Connect",
    path: "src/components/ui/progress-metric-card.tsx",
  },
  credits: [],
  props: [
    { name: "title", type: "string", description: "Card heading; also the single series' name." },
    {
      name: "data / series",
      type: "{ date: string; value: number }[] / { name, data, accent?, color?, footerLabel? }[]",
      description:
        "One series, or several sharing one scale. Dates are ISO days (YYYY-MM-DD) for the calendar and axis formatting; any other string passes through as a label.",
    },
    {
      name: "total",
      type: "string | number",
      description: "Headline figure. Defaults to the compact sum of the windowed primary series.",
    },
    {
      name: "accent",
      type: '"go" | "stop" | "neutral" | "brand" | "lead"',
      description: "Fixed colour. Omit to colour by direction across the window: go up, stop down, neutral flat.",
    },
    {
      name: "period / periodOptions / onPeriodChange",
      type: "string / { label, points?, from?, to? }[] / (option) => void",
      description:
        "The window choices. `points` keeps the trailing N points; `from`/`to` filter by ISO day; neither means everything. `period` names the starting choice.",
    },
    {
      name: "allowCustomRange",
      type: "boolean",
      description: "Adds a Custom range step to the dropdown: a Monday-first range calendar bounded by the data's first and last day.",
    },
    { name: "size", type: '"sm" | "md" | "lg"', description: "Padding, title and headline scale. Default md." },
    { name: "defaultView", type: '"curve" | "bars"', description: "Starting chart view. Default curve." },
    {
      name: "showFooter / showDelta / showStats / footerStats",
      type: 'boolean / boolean / boolean / "series" | { label, value }[] | (series) => { label, value }[]',
      description:
        "The footer bar: delta on the left, peak / low / avg on the right unless footerStats replaces them (\"series\" sums every series after the first).",
    },
    {
      name: "delta / deltaLabel / percent / trend",
      type: "string / string / string / \"up\" | \"down\"",
      description: "Override the derived footer delta, its label (default \"today\"), the trend badge and its direction.",
    },
    { name: "unit", type: "string", description: "Appended to exact values in the tooltip." },
    {
      name: "valueFormatter / dateFormatter",
      type: "(value: number) => string / (date: string) => string",
      description: "Replace the compact/exact number formatting and the tooltip's date label.",
    },
    {
      name: "showAxes / showXAxis / showYAxis",
      type: "boolean",
      description: "Draw a three-tick y scale and first/middle/last date labels.",
    },
    { name: "fullWidth", type: "boolean", description: "Chart spans the whole card instead of its right 62%." },
    { name: "loading", type: "boolean", description: "A skeleton laid out bar for bar like the loaded card." },
    {
      name: "emptyTitle / emptyDescription",
      type: "string",
      description: "Copy shown when the window holds fewer than two points.",
    },
  ],
};
