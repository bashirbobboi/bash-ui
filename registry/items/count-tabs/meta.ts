import type { ItemMeta } from "../../types.ts";

export const meta: ItemMeta = {
  name: "count-tabs",
  title: "Count tabs",
  kind: "widget",
  category: "navigation",
  type: "registry:component",
  description:
    "An underlined tab row where each tab carries a count chip, the open tab in the lead colour with a 2px underline on the row's rule and its chip on the lead wash.",
  whenToUse:
    "Use to switch between queues or lists on one page where how many items wait in each is the point (a review page, an inbox's folders). Not for page-level section navigation between routes; use gooey-tabs or a link row for that.",
  files: ["registry/items/count-tabs/count-tabs.tsx"],
  dependencies: [],
  registryDependencies: [],
  origin: {
    project: "180Connect",
    path: "src/app/(app)/admin/review/review-panel.tsx",
  },
  credits: [],
  props: [
    {
      name: "items",
      type: "{ id: string; label: ReactNode; count?: number | null }[]",
      description: "The tabs. A count (zero included) shows as a chip; omit it for no chip.",
    },
    { name: "value", type: "string", description: "Controlled open tab." },
    {
      name: "defaultValue",
      type: "string",
      description: "Starting tab when uncontrolled. Defaults to the first item.",
    },
    {
      name: "onValueChange",
      type: "(id: string) => void",
      description: "Called when a tab opens, by click or by ←/→/Home/End.",
    },
    { name: "ariaLabel", type: "string", description: "Accessible name of the tablist." },
    {
      name: "idPrefix",
      type: "string",
      description:
        "Prefix for tab and panel ids. Pass one and spread countTabPanelProps(idPrefix, id, value) onto each panel to link them.",
    },
    {
      name: "countTabPanelProps",
      type: "(idPrefix, id, value) => { id, role, aria-labelledby, hidden }",
      description: "Exported helper: the props for the panel behind a tab.",
    },
    { name: "className", type: "string", description: "On the tablist." },
  ],
};
