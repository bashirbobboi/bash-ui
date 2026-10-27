import type { FunnelStage } from "./funnel-chart";
export const stages: readonly FunnelStage[] = [
  { label: "In database", value: 1000, caption: "Every client on the working list" },
  { label: "Contacted", value: 0 },
  { label: "Responded", value: 0 },
  { label: "Converted", value: 0 },
];
