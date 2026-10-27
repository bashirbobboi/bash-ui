import type { ItemMeta } from "../../types.ts";

export const meta: ItemMeta = {
  name: "info-tooltip",
  title: "Info tooltip",
  kind: "primitive",
  category: "overlays",
  type: "registry:ui",
  description:
    "An (i) icon that springs open an inverted tooltip with an optional title and footer; opens on tap on a phone.",
  whenToUse:
    "Use to explain a label, metric or setting in a sentence or two without cluttering the screen, or wrap any element to give it a hover hint. Do not put actions or anything the reader must see inside it; that belongs in a popover or on the page.",
  files: ["registry/items/info-tooltip/info-tooltip.tsx"],
  dependencies: ["radix-ui", "motion", "lucide-react"],
  origin: {
    project: "180Connect",
    path: "src/components/ui/info-tooltip.tsx",
  },
  credits: [
    {
      name: "Animate UI (Radix Tooltip)",
      url: "https://animate-ui.com",
      license: "MIT",
    },
  ],
  props: [
    {
      name: "content",
      type: "ReactNode",
      description: "The body. With neither content nor title, the children render alone.",
    },
    { name: "title", type: "ReactNode", description: "Bold line at the top." },
    {
      name: "footer",
      type: "ReactNode",
      description: "Smaller line under a hairline, for a source or caveat.",
    },
    {
      name: "children",
      type: "ReactNode",
      description:
        "Custom trigger. Omit for the default (i) button, which also opens on tap; a custom trigger keeps its own tap behaviour.",
    },
    {
      name: "side / align / sideOffset",
      type: '"top" | "bottom" | "left" | "right" / "start" | "center" | "end" / number',
      description: "Placement. Defaults to top, centred, 6px away.",
    },
    {
      name: "delayDuration",
      type: "number",
      description: "Hover delay in ms before it opens. Defaults to 150.",
    },
    {
      name: "label",
      type: "string",
      description: "Accessible name for the default trigger; falls back to a string title or content.",
    },
    { name: "showArrow", type: "boolean", description: "Adds a small pointer arrow." },
    {
      name: "contentClassName / triggerClassName",
      type: "string",
      description: "Extra classes for the box and the default trigger.",
    },
  ],
};
