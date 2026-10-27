import type { ItemMeta } from "../../types.ts";
export const meta: ItemMeta = {
  "name": "image-collage",
  "title": "Image collage",
  "kind": "pattern",
  "category": "media",
  "type": "registry:block",
  "description": "A responsive image collage with proportionate widths, aligned image heights and captions. Every row fills the available width.",
  "whenToUse": "Use to show school, employer or project images upright without decorative framing. Images share a height within each row, and a final single image fills the row. Supply aspect ratios for stable layout before loading, plus optional captions and descriptions.",
  "files": [
    "registry/items/image-collage/image-collage.tsx"
  ],
  "origin": {
    "project": "Portfolio",
    "path": "src/app/page.tsx (education, experience and project imagery; composed into a collage for bash-ui)"
  },
  "credits": [],
  "props": [
    {
      "name": "images",
      "type": "CollageImage[]",
      "description": "Images, alt text, optional captions, descriptions, destinations and aspect ratios."
    },
    {
      "name": "columns",
      "type": "number",
      "description": "Images per row on wider screens, from one to four. Widths follow each image’s proportions; mobile stacks vertically."
    },
    {
      "name": "gap",
      "type": "number",
      "description": "Space between images in pixels."
    },
    {
      "name": "showCaptions",
      "type": "boolean",
      "description": "Show image captions."
    }
  ],
  "previewWidth": "full"
};
