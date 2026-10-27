import type { ItemMeta } from "../../types.ts";

export const meta: ItemMeta = {
  name: "pipeline-chart",
  title: "Pipeline chart",
  kind: "pattern",
  category: "charts",
  type: "registry:block",
  description:
    "A chart card that plots several pipeline stages (contacted, replied, converted) over time on real axes, with a per-stage legend that doubles as the summary, a line/bar toggle, a crosshair tooltip and a period dropdown that opens a custom-range calendar.",
  whenToUse:
    "Use to compare a few daily counts over a reader-chosen window, where each line needs its own figure and change against the window before. Not for a single KPI with a sparkline (use a stat tile), for more than about five series, or for non-time categorical comparisons (use a bar chart).",
  files: ["registry/items/pipeline-chart/pipeline-chart.tsx"],
  dependencies: ["motion", "lucide-react"],
  registryDependencies: ["date-range-calendar"],
  origin: {
    project: "180Connect",
    path: "src/components/ui/series-line-chart-card.tsx (ViewToggle from src/components/ui/metric-controls.tsx); used as \"Contacted, replied, converted\" in src/components/dashboard/performance-section.tsx",
  },
  credits: [],
  props: [
    { name: "title", type: "string", description: "The card heading." },
    {
      name: "subtitle",
      type: "string",
      description: "What one point means, in the words of the job. The grain (daily, weekly totals) is appended.",
    },
    {
      name: "series",
      type: "{ name: string; data: { date: string; value: number }[]; color?: string }[]",
      description:
        "One series per stage: daily points as UTC ISO days, in order, sharing dates. Colours default to go, lead, hold, stop, dim by index.",
    },
    { name: "unit", type: "string", description: "Plural noun captioning the y-axis, e.g. \"clients\"." },
    {
      name: "periodOptions / period",
      type: "{ label; points?; from?; to? }[] / string",
      description: "The presets, and the label to open on. Defaults to Past 30 / Past 90 days.",
    },
    {
      name: "allowCustomRange",
      type: "boolean",
      description: "Adds a Custom range step whose calendar is bounded to the first and last day of the data.",
    },
    {
      name: "onRangeChange",
      type: "(option: PeriodOption, window: { from: string; to: string } | null) => void",
      description:
        "Fires on every window change with the days it resolved to. The card filters the data it holds; use this to fetch more.",
    },
    {
      name: "totals",
      type: "({ total: number; previous?: number | null } | undefined)[]",
      description:
        "Per-series legend figures overriding the summed window (e.g. distinct clients from a server); previous enables the change figure.",
    },
    { name: "defaultView", type: '"curve" | "bars"', description: "Opening view. Defaults to curve." },
    {
      name: "toggleId",
      type: "string",
      description: "Shared-layout id for the view toggle's pill; give each chart on a page its own.",
    },
    { name: "emptyMessage", type: "string", description: "Shown when the window has fewer than two points." },
    { name: "now", type: "Date", description: "Fixes today for the calendar's presets." },
  ],
};
