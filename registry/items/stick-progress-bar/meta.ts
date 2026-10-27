import type { ItemMeta } from "../../types.ts";

export const meta: ItemMeta = {
  name: "stick-progress-bar",
  title: "Stick progress bar",
  kind: "widget",
  category: "charts",
  type: "registry:component",
  description:
    "A progress bar drawn as a row of vertical sticks that grow in one after another, as one value against a total or as a split into coloured segments, with a hover tooltip.",
  whenToUse:
    "Reach for it to show a share of a whole on a card: progress against a limit, a split of spending, a count toward a milestone (with a position-fixed colour ramp). Not for values over time or comparisons of many series; use a chart for those.",
  files: ["registry/items/stick-progress-bar/stick-progress-bar.tsx"],
  dependencies: ["motion"],
  origin: {
    project: "180Connect",
    path: "src/components/ui/horizontal-stick-gauge.tsx",
  },
  credits: [],
  props: [
    {
      name: "checked / total",
      type: "number",
      description: "Single-metric mode: how many of how many. Ignored when segments are given.",
    },
    {
      name: "segments",
      type: "{ id?, label, value, color, hoverColor?, ramp?: { at, color }[] }[]",
      description:
        "Multi-segment mode: sticks are split by share. A ramp colours each stick by its position along the whole gauge.",
    },
    {
      name: "activeColor / inactiveColor / hoverInactiveColor",
      type: "string",
      description: "CSS colours for the filled sticks, the track and the hovered track. Default lead, rule-soft, faint.",
    },
    {
      name: "activeGradient",
      type: "string[]",
      description: "Two or more colours the filled sticks run through left to right (single-metric mode, brand marks only).",
    },
    {
      name: "pitch / stickWidth / stickHeight",
      type: "number",
      description: "Stick spacing, thickness and height in px. Default 8.5, 3, 16.",
    },
    {
      name: "checkedLabel / remainingLabel",
      type: "string",
      description: "Tooltip labels for the two halves in single-metric mode.",
    },
    {
      name: "valueFormatter",
      type: "(value: number) => string",
      description: "Formats values in the tooltip and default screen-reader text.",
    },
    {
      name: "showTooltip",
      type: "boolean",
      description: "Show the floating tooltip on hover. Default true.",
    },
    {
      name: "alwaysVisible",
      type: "boolean",
      description: "Skip the scroll-into-view reveal; use for gauges that are on screen when they mount.",
    },
    {
      name: "ariaLabel / ariaValueText",
      type: "string",
      description: "Accessible name and value text for the progressbar.",
    },
  ],
};
