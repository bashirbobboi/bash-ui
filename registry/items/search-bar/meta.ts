import type { ItemMeta } from "../../types.ts";

export const meta: ItemMeta = {
  name: "search-bar",
  title: "Search bar",
  kind: "widget",
  category: "inputs",
  type: "registry:component",
  description:
    "A pill search field with a cycling prompt that unfolds into a staged filter panel, with an optional plain-English ask field and removable filter chips.",
  whenToUse:
    "Reach for it as the one search control at the top of a list page, where people combine a name search with several filters and submit them together. Not for instant as-you-type filtering, inline table search, or a compact toolbar field: nothing is reported until Enter or the disc is pressed, and the open panel needs about 350px of room below it.",
  files: ["registry/items/search-bar/search-bar.tsx"],
  dependencies: ["motion", "lucide-react"],
  origin: { project: "180Connect", path: "src/components/brand/search-bar.tsx" },
  credits: [],
  props: [
    { name: "value / defaultValue", type: "string", description: "Controlled or uncontrolled query text." },
    { name: "onValueChange", type: "(value: string) => void", description: "Every keystroke. Nothing is searched until submit." },
    { name: "placeholder", type: "string", description: "Static half of the prompt. Default \"I want to learn about\"." },
    { name: "subjects", type: "readonly string[]", description: "Words that cycle after the prompt while the field is empty." },
    { name: "categories", type: "FilterCategory[]", description: "Filter groups: { label, options } or { label, freeText } for a typed filter. Omit to hide the filters toggle." },
    { name: "filters / defaultFilters", type: "ActiveFilter[]", description: "Controlled or uncontrolled staged filters; each renders as a removable chip." },
    { name: "onFiltersChange", type: "(filters: ActiveFilter[]) => void", description: "A filter was staged or removed. Not a search." },
    { name: "onSubmit", type: "(query, filters) => void | Promise", description: "Enter, the disc, or Clear filters (empty query and filters). A returned promise keeps the spinner up." },
    { name: "pending", type: "boolean", description: "The host's own work is running; the disc shows the rolling square." },
    { name: "minSpinMs", type: "number", description: "Shortest the rolling square plays after a submit. Default 1500." },
    { name: "ask", type: "SearchBarAsk", description: "Optional descriptive field at the top of the panel: { label, placeholder, maxLength, onAsk(question), pending }." },
    { name: "chipsBelow", type: "boolean", description: "Show staged filters as chips under the pill. Default true." },
  ],
};
