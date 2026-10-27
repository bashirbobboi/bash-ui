import type { ItemMeta } from "../../types.ts";
export const meta: ItemMeta = {
  "name": "ranking-table",
  "title": "Ranking table",
  "kind": "pattern",
  "category": "lists",
  "type": "registry:block",
  "description": "A landlord ranking with a sentence-style measure picker, direction toggle, sortable columns and mobile cards.",
  "whenToUse": "Use for comparing landlord collections and platform fees. Sorting stays local to the supplied rows, with optional row destinations supplied by the caller.",
  "files": [
    "registry/items/ranking-table/ranking-table.tsx"
  ],
  "dependencies": [],
  "registryDependencies": [
    "sort-by-heading"
  ],
  "origin": {
    "project": "Ledge",
    "path": "src/components/admin/top-landlords.tsx"
  },
  "credits": [],
  "props": [
    {
      "name": "rows",
      "type": "LandlordRow[]",
      "description": "Names, optional hrefs, collected rent, platform fees and payment counts; money is integer kobo."
    },
    {
      "name": "prefix",
      "type": "string",
      "description": "Heading before the measure picker."
    },
    {
      "name": "defaultSort",
      "type": "\"fee\" | \"gmv\" | \"avg\" | \"payments\"",
      "description": "Initial ranking measure."
    },
    {
      "name": "defaultDirection",
      "type": "\"desc\" | \"asc\"",
      "description": "Initial sort direction."
    },
    {
      "name": "limit",
      "type": "number",
      "description": "Maximum visible rows, defaults to ten."
    }
  ],
  "previewWidth": "full"
};
