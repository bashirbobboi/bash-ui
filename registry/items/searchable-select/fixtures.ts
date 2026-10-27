import type { SearchableOptionGroup } from "./searchable-select";

export const groups: readonly SearchableOptionGroup[] = [
  { label: "Charities", options: [
    { value: "food", label: "Sheffield Food Network", keywords: ["food bank"] },
    { value: "shelter", label: "Roundabout Sheffield", keywords: ["housing", "young people"] },
    { value: "wildlife", label: "Sheffield Wildlife Trust", keywords: ["nature"] },
  ] },
  { label: "Social enterprises", options: [
    { value: "cafe", label: "The Community Café" },
    { value: "bikes", label: "Recycle Bikes", keywords: ["cycling"] },
  ] },
];
