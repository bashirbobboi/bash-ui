import type { ItemMeta } from "../../types.ts";

export const meta: ItemMeta = {
  name: "link-preview",
  title: "Link preview",
  kind: "widget",
  category: "overlays",
  type: "registry:component",
  description: "A text trigger reveals a screenshot of the destination webpage on hover, keyboard focus or tap. The screenshot fills the card; its address rises in on a frosted chip once the pointer is on it.",
  whenToUse: "Use for portfolios, references and policy summaries where readers benefit from context before navigating. Supply a screenshot of the page; this component does not capture websites or fetch metadata. Keep essential information available on the destination page.",
  files: ["registry/items/link-preview/link-preview.tsx"],
  dependencies: ["radix-ui", "motion", "lucide-react"],
  origin: { project: "bash-ui", path: "registry/items/link-preview/link-preview.tsx" },
  credits: [],
  props: [
    { name: "trigger", type: "ReactElement", description: "Optional existing logo button or link used as the trigger." },
    { name: "isCurrentSite", type: "boolean", description: "Shows an already-on-this-website message when tapped instead of navigating." },
    { name: "children", type: "ReactNode", description: "Text shown in the preview trigger." },
    { name: "href", type: "string", description: "HTTP(S) or root-relative destination, opened from the card." },
    { name: "title", type: "string", description: "Accessible name for the screenshot and link; shown on the chip when href has no hostname." },
    { name: "imageSrc", type: "string", description: "Required screenshot image URL for the destination webpage." },
    { name: "side", type: '"top" | "right" | "bottom" | "left"', description: "Preferred position; adjusts to fit the viewport." },
  ],
};
