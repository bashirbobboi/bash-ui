import type { GooeyTabItem } from "./gooey-tabs.tsx";

/** A client record's sections, two of them with something new in them. */
export const sections: GooeyTabItem[] = [
  { id: "overview", label: "Overview" },
  { id: "outreach", label: "Outreach", count: 7 },
  { id: "news", label: "News", count: 3 },
  { id: "activity", label: "Activity" },
];
