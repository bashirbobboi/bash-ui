import type { ItemMeta } from "../../types.ts";

export const meta: ItemMeta = {
  name: "gooey-tabs",
  title: "Gooey tabs",
  kind: "widget",
  category: "navigation",
  type: "registry:component",
  description:
    "A floating segmented pill of equal-width tabs whose solid marker slides to the picked tab while a liquid silhouette chases it on a spring, stretching and trailing a droplet tail.",
  whenToUse:
    "Use as the primary section switcher at the top of a record or detail page with three to six sections, where each tab can be a route (pass href) or local state. Not for long or variable-length labels (every tab is one width) or for a queue switcher that needs counts as the main signal; use count-tabs for that.",
  files: ["registry/items/gooey-tabs/gooey-tabs.tsx"],
  dependencies: ["liquid-gooey", "motion"],
  registryDependencies: [],
  origin: {
    project: "180Connect",
    path: "src/app/(app)/clients/[id]/record-tabs.tsx",
  },
  credits: [
    {
      name: "liquid-gooey by Jakub Antalik (the Liquid move effect, used as a dependency)",
      url: "https://github.com/Jakubantalik/Libraries.dev",
      license: "MIT",
    },
  ],
  props: [
    {
      name: "items",
      type: "{ id: string; label: ReactNode; href?: string; count?: number | null }[]",
      description:
        "The tabs. With href a tab renders as a link (aria-current=\"page\"), otherwise a button. A count above zero shows beside the label.",
    },
    {
      name: "value",
      type: "string | null",
      description:
        "Controlled open tab. null or an id not in items hides the marker (e.g. a route the bar does not own).",
    },
    { name: "defaultValue", type: "string | null", description: "Starting tab when uncontrolled." },
    {
      name: "onValueChange",
      type: "(id: string) => void",
      description: "Called with the picked tab's id, for links and buttons alike.",
    },
    {
      name: "renderLink",
      type: "(props: GooeyTabLinkProps) => ReactNode",
      description:
        "Renders a tab with an href, for a router link (e.g. next/link). Spread the props (minus item) onto it. Defaults to <a>.",
    },
    {
      name: "tabWidth",
      type: "number",
      description:
        "Every tab's width in px, so the marker's offset is arithmetic. Size it for the longest label plus count. Default 112.",
    },
    { name: "ariaLabel", type: "string", description: 'Accessible name of the nav. Default "Sections".' },
    {
      name: "gooBlur / gooContrast",
      type: "number",
      description: "Goo filter tuning: blur sigma (default 5) and edge sharpness (default 18).",
    },
    {
      name: "className",
      type: "string",
      description: "On the nav. Add `sticky top-0 z-30` to float it over the page; the pill has a frosted backdrop.",
    },
  ],
};
