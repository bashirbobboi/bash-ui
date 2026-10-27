import type { ItemMeta } from "../../types.ts";
export const meta: ItemMeta = {
  "name": "radial-nav",
  "title": "Radial navigation",
  "kind": "widget",
  "category": "navigation",
  "type": "registry:component",
  "description": "Portfolio’s original radial navigation: selected-only expanding labels, a shortest-path spring pointer, and ring and pointer emphasis during rotation.",
  "whenToUse": "Use for compact section navigation. Choose inline or collapsible presentation; handle navigation and scroll tracking through activeId and onActiveChange in the consuming page.",
  "files": [
    "registry/items/radial-nav/radial-nav.tsx",
    "registry/items/radial-nav/radial-nav.LICENSE.txt"
  ],
  "origin": {
    "project": "Portfolio",
    "path": "src/components/animate-ui/components/community/radial-nav.tsx; src/components/radial-nav-wrapper.tsx"
  },
  "credits": [
    {
      "name": "Animate UI community Radial Nav by arhamkhnz",
      "url": "https://animate-ui.com/docs/components/community/radial-nav",
      "license": "MIT WITH Commons-Clause"
    }
  ],
  "props": [
    {
      "name": "items",
      "type": "RadialNavItem[]",
      "description": "Item IDs, labels, Lucide icons and optional angles."
    },
    {
      "name": "size",
      "type": "number",
      "description": "Diameter of the navigation ring."
    },
    {
      "name": "buttonSize",
      "type": "number",
      "description": "Diameter of a collapsed item."
    },
    {
      "name": "menuButtonConfig",
      "type": "MenuButtonConfig",
      "description": "Original icon size, button size and padding configuration."
    },
    {
      "name": "activeId",
      "type": "number | null",
      "description": "Controlled selection."
    },
    {
      "name": "defaultActiveId",
      "type": "number",
      "description": "Initial uncontrolled selection."
    },
    {
      "name": "onActiveChange",
      "type": "(id: number) => void",
      "description": "Selection callback; navigate or scroll in the consumer."
    },
    {
      "name": "collapsible",
      "type": "boolean",
      "description": "Start with an opening button instead of the expanded ring."
    },
    {
      "name": "label",
      "type": "string",
      "description": "Accessible navigation label."
    }
  ],
  "dependencies": [
    "motion",
    "lucide-react"
  ]
};
