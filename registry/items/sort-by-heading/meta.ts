import type { ItemMeta } from "../../types.ts";
export const meta: ItemMeta = {
  "name": "sort-by-heading",
  "title": "Sort-by heading",
  "kind": "widget",
  "category": "inputs",
  "type": "registry:component",
  "description": "An editorial heading that reads \u201cTop landlords by [platform fee]\u201d, followed by a direction toggle.",
  "whenToUse": "Use when the ranking criterion belongs in the heading. A custom dropdown preserves the sentence-like appearance, with keyboard selection, a checked item, Escape and click-away dismissal.",
  "files": [
    "registry/items/sort-by-heading/sort-by-heading.tsx"
  ],
  "dependencies": ["radix-ui"],
  "registryDependencies": [],
  "origin": {
    "project": "Ledge",
    "path": "src/components/admin/top-landlords.tsx"
  },
  "credits": [],
  "props": [
    {
      "name": "prefix",
      "type": "string",
      "description": "Words before the criterion."
    },
    {
      "name": "options",
      "type": "readonly SortChoice[]",
      "description": "Available ranking measures."
    },
    {
      "name": "value / defaultValue",
      "type": "string",
      "description": "Controlled or initial measure."
    },
    {
      "name": "onValueChange",
      "type": "(value: string) => void",
      "description": "Reports a new measure."
    },
    {
      "name": "direction / defaultDirection",
      "type": "\"asc\" | \"desc\"",
      "description": "Controlled or initial direction."
    },
    {
      "name": "onDirectionChange",
      "type": "(direction) => void",
      "description": "Reports a changed direction."
    }
  ]
};
