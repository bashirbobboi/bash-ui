import type { CountTabItem } from "./count-tabs.tsx";

/** A review page's queues and how much waits in each, as on 180Connect. */
export const queues: CountTabItem[] = [
  { id: "held", label: "Held for review", count: 199 },
  { id: "changes", label: "Status changes", count: 6 },
  { id: "replies", label: "Unmatched replies", count: 0 },
  { id: "history", label: "History" },
];
