import type { ItemMeta } from "../../types.ts";

export const meta: ItemMeta = {
  name: "date-range-calendar",
  title: "Date range calendar",
  kind: "widget",
  category: "inputs",
  type: "registry:component",
  description:
    "A Monday-first range calendar that previews the span under the cursor, greys out days outside its bounds and jumps by month or typed year; plus a period dropdown whose \"Custom range\" step widens the same popover into the calendar.",
  whenToUse:
    "Use for picking a reporting window or a single due date inside a card or popover, especially where a native date input would close its parent on blur or format to the wrong locale. Use DateRangePicker when presets cover most needs and exact dates are the exception; not for date-and-time entry or recurring schedules.",
  files: [
    "registry/items/date-range-calendar/date-range-calendar.tsx",
    "registry/items/date-range-calendar/date-range-picker.tsx",
  ],
  dependencies: ["motion", "lucide-react"],
  registryDependencies: [],
  origin: {
    project: "180Connect",
    path: "src/components/ui/date-range-calendar.tsx (rules from src/lib/date-range.ts); popover from PeriodSelect in src/components/ui/metric-controls.tsx",
  },
  credits: [],
  props: [
    {
      name: "value",
      type: "{ from: string | null; to: string | null }",
      description: "DateRangeCalendar: the committed selection, as UTC ISO days (YYYY-MM-DD).",
    },
    {
      name: "onChange",
      type: "(selection: RangeSelection) => void",
      description:
        "DateRangeCalendar: every click. The first click reports { from, to: null }; a click before the start begins a new range.",
    },
    {
      name: "mode",
      type: '"range" | "single"',
      description: "DateRangeCalendar: single picks one day, reported as { from: day, to: day }.",
    },
    {
      name: "min / max",
      type: "string | null",
      description: "Inclusive ISO-day bounds; days outside are shown but not selectable.",
    },
    {
      name: "showPresets / presetOptions",
      type: "boolean / { label; from; to }[]",
      description:
        "DateRangeCalendar: the shortcut row. Defaults to This month, Last month, This quarter, clamped to the bounds.",
    },
    { name: "now", type: "Date", description: "Fixes today; defaults to the real clock." },
    {
      name: "options",
      type: "{ label: string; points?: number; from?: string; to?: string }[]",
      description: "DateRangePicker: the preset list. A custom range arrives as { label, from, to }.",
    },
    {
      name: "value / onChange",
      type: "string / (option: PeriodOption) => void",
      description: "DateRangePicker: the selected option's label, and the option chosen.",
    },
    {
      name: "allowCustomRange / defaultOption",
      type: "boolean / PeriodOption",
      description:
        "DateRangePicker: adds the Custom range step; Reset sends the selection back to defaultOption.",
    },
    {
      name: "rangeMin / rangeMax",
      type: "string | null",
      description: "DateRangePicker: the calendar's bounds, normally the first and last day of the data.",
    },
  ],
};
