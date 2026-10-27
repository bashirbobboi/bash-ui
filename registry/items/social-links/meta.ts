import type { ItemMeta } from "../../types.ts";
export const meta: ItemMeta = {
  "name": "social-links",
  "title": "Social link buttons",
  "kind": "widget",
  "category": "buttons",
  "type": "registry:component",
  "description": "Watercolour GitHub and LinkedIn buttons with transparent artwork, generous spacing, accessible labels and configurable link targets.",
  "whenToUse": "Use when custom image artwork is the social link itself. Supply your own artwork URLs and destinations.",
  "files": [
    "registry/items/social-links/social-links.tsx"
  ],
  "origin": {
    "project": "Portfolio",
    "path": "src/app/page.tsx (hero social links)"
  },
  "credits": [],
  "props": [
    {
      "name": "links",
      "type": "SocialLink[]",
      "description": "Artwork URL, accessible label and destination for each link; optional sizeScale adjusts an individual image’s visual size."
    },
    {
      "name": "size",
      "type": "number",
      "description": "Artwork height in pixels."
    },
    {
      "name": "gap",
      "type": "number",
      "description": "Space between links in pixels."
    },
    {
      "name": "showLabels",
      "type": "boolean",
      "description": "Show the link names below the artwork."
    },
    {
      "name": "newWindow",
      "type": "boolean",
      "description": "Open links in a new tab, default true."
    }
  ]
};
