import type { FilterCategory } from "./search-bar.tsx";

export const categories: FilterCategory[] = [
  {
    label: "Filter by city",
    options: ["Leeds", "Manchester", "Sheffield"].map((city) => ({ label: city, value: city })),
  },
  {
    label: "Filter by outreach status",
    options: [
      { label: "Not contacted", value: "Not contacted", colour: "var(--faint)" },
      { label: "Contacted", value: "Contacted", colour: "var(--lead)" },
      { label: "Meeting set", value: "Meeting set", colour: "var(--hold)" },
      { label: "Proposal sent", value: "Proposal sent", colour: "var(--go)" },
    ],
  },
];
