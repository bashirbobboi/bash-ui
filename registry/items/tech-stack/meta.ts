import type { ItemMeta } from "../../types.ts";
export const meta: ItemMeta = {
  "name": "tech-stack",
  "title": "Tech stack logos",
  "kind": "widget",
  "category": "data-display",
  "type": "registry:component",
  "description": "A tilted, overlapping stack of technology logos that fans out on hover or focus and shows each logo\u2019s label in a tooltip.",
  "whenToUse": "Use beside project descriptions to list technologies. Logos and text are props; hover, keyboard focus and touch reveal the details.",
  "files": [
    "registry/items/tech-stack/tech-stack.tsx"
  ],
  "origin": {
    "project": "Portfolio",
    "path": "src/components/project-tech-stack.tsx"
  },
  "credits": [
    {
      "name": "Technology brand logos from Wikimedia Commons and Icons8, preview fixtures only (per-file licences not recorded; Icons8's free licence requires a link back)",
      "license": "unknown"
    }
  ],
  "props": [
    {
      "name": "items",
      "type": "TechStackItem[]",
      "description": "Logo URLs, labels, subtitles, optional rotation and fit."
    },
    {
      "name": "size",
      "type": "number",
      "description": "Tile size in pixels."
    },
    {
      "name": "overlap",
      "type": "number",
      "description": "Overlap before expansion."
    },
    {
      "name": "expandedGap",
      "type": "number",
      "description": "Gap after expansion."
    },
    {
      "name": "expandOnView",
      "type": "boolean",
      "description": "Also fan out on mobile when the strip enters the reading area."
    }
  ],
  "dependencies": [
    "motion",
    "radix-ui"
  ]
};
