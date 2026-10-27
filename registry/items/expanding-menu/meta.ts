import type { ItemMeta } from "../../types.ts";
export const meta: ItemMeta = {
  "name": "expanding-menu",
  "title": "Expanding menu",
  "kind": "widget",
  "category": "navigation",
  "type": "registry:component",
  "description": "Ledge\u2019s frosted navigation pill expands into a staggered link panel; the plus becomes a minus.",
  "whenToUse": "Use for compact shared navigation. Preserves Ledge’s 148×56 pill, 300px panel, fixed 28px corners, frosted layers, spring timing and staggered links; supports a footer slot.",
  "files": [
    "registry/items/expanding-menu/expanding-menu.tsx"
  ],
  "dependencies": [
    "motion"
  ],
  "registryDependencies": [],
  "origin": {
    "project": "Ledge",
    "path": "src/components/expanding-menu.tsx"
  },
  "credits": [],
  "props": [
    {
      "name": "items",
      "type": "MenuItem[]",
      "description": "Link labels and destinations."
    },
    {
      "name": "label",
      "type": "string",
      "description": "Collapsed label; the open label is Close, as in Ledge."
    },
    {
      "name": "align",
      "type": "\"left\" | \"right\"",
      "description": "Edge anchored during the morph."
    },
    {
      "name": "footer",
      "type": "ReactNode",
      "description": "Optional content below the links."
    },
    {
      "name": "onNavigate",
      "type": "(item, event) => void",
      "description": "Navigation callback; preventDefault for client-side routing."
    }
  ]
};
