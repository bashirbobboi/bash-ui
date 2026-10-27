import type { ItemMeta } from "../../types.ts";
export const meta: ItemMeta = {
  "name": "doodle-portrait",
  "title": "Doodle portrait",
  "kind": "widget",
  "category": "media",
  "type": "registry:component",
  "description": "A portrait framed by the original animated doodle in the top left and its rotated copy in the bottom right.",
  "whenToUse": "Use for a personal introduction. Supply a portrait and decorative artwork; include a static doodle frame for reduced motion.",
  "files": [
    "registry/items/doodle-portrait/doodle-portrait.tsx"
  ],
  "origin": {
    "project": "Portfolio",
    "path": "src/app/page.tsx (hero portrait)"
  },
  "credits": [],
  "props": [
    {
      "name": "src",
      "type": "string",
      "description": "Portrait URL."
    },
    {
      "name": "alt",
      "type": "string",
      "description": "Description of the portrait."
    },
    {
      "name": "doodleSrc",
      "type": "string",
      "description": "Decorative image or animation URL."
    },
    {
      "name": "doodleStillSrc",
      "type": "string",
      "description": "Static decoration used for reduced motion; omitted decorations are hidden in that mode."
    },
    {
      "name": "width / height",
      "type": "number",
      "description": "Portrait proportions and maximum size."
    },
    {
      "name": "doodleSize",
      "type": "number",
      "description": "Decoration size relative to the portrait."
    },
    {
      "name": "showDoodles",
      "type": "boolean",
      "description": "Show or hide both decorations."
    }
  ],
  "dependencies": [
    "motion"
  ]
};
