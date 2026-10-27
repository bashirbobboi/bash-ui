import type { ItemMeta } from "../../types.ts";

export const meta: ItemMeta = {
  name: "range-slider",
  title: "Range slider",
  kind: "widget",
  category: "inputs",
  type: "registry:component",
  description:
    "A two-thumb range slider over a histogram whose bars, inside the range, run red on the left to green on the right, with the minimum and maximum read out large beneath it; plus a single-value stick slider on the same ramp.",
  whenToUse:
    "Reach for it when a filter is a numeric range where low-to-high also reads bad-to-good or small-to-large (income, budget, size), especially with a distribution worth showing; pass `stops` for a non-linear scale. Not for picking one value from a short list (use a select or segmented control), and not where red/green would imply a judgement the data does not make (use colorScheme=\"primary\").",
  files: [
    "registry/items/range-slider/range-slider.tsx",
    "registry/items/range-slider/stick-slider.tsx",
  ],
  dependencies: ["motion"],
  origin: {
    project: "180Connect",
    path: "src/components/ui/range-slider.tsx (+ src/components/ui/stick-slider.tsx); used in src/app/(app)/admin/charity-commission/filter-builder.tsx",
  },
  credits: [],
  props: [
    { name: "value / defaultValue", type: "[number, number]", description: "The selected range, controlled or uncontrolled." },
    { name: "onValueChange", type: "(value: [number, number]) => void", description: "Every change while dragging." },
    { name: "onValueCommit", type: "(value: [number, number]) => void", description: "Once per drag end or key press." },
    { name: "min / max / step", type: "number", description: "A linear scale. Defaults 0, 100, 1." },
    { name: "stops", type: "readonly number[]", description: "A non-linear scale: each value is an equal step along the track. Overrides min/max/step." },
    { name: "formatValue", type: "(value: number) => string", description: "How a value reads in the readout and to screen readers." },
    { name: "data", type: "readonly number[]", description: "Histogram bar heights behind the thumbs. Without it a thin rail is drawn." },
    { name: "barLabel", type: "(index: number) => string | undefined", description: "Hover text for a histogram bar." },
    { name: "colorScheme", type: "\"ramp\" | \"primary\"", description: "Red-to-green ramp (default) or a single primary fill." },
    { name: "colorAt", type: "(ratio: number) => string", description: "Override the ramp: a CSS colour for a position 0-1." },
    { name: "minLabel / maxLabel", type: "string", description: "Readout headings and thumb aria-labels." },
    { name: "minSubtitle / maxSubtitle", type: "ReactNode | (value: number) => ReactNode", description: "A line under each figure, e.g. \"From £25k\"." },
    { name: "showReadout", type: "boolean", description: "Show the two large figures under the slider. Default true." },
    { name: "showHistogram / histogramHeight", type: "boolean / string", description: "Toggle the bars; height classes for their area." },
    { name: "title", type: "ReactNode", description: "Optional heading above the slider." },
    { name: "StickSlider", type: "{ value, onValueChange, min?, max?, step?, readOnly?, colorAt?, gooChase?, ... }", description: "Single-value sibling: a native range input drawn as ramp-coloured sticks with a liquid handle." },
  ],
};
