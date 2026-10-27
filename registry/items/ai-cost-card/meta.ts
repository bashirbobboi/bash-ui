import type { ItemMeta } from "../../types.ts";

export const meta: ItemMeta = {
  name: "ai-cost-card",
  title: "AI cost card",
  kind: "widget",
  category: "charts",
  type: "registry:component",
  description:
    "A spend card for estimated AI cost: the window's total with its change on the prior stretch, a 7D–ALL window switch, the split by kind of work as horizontal sticks with a figure legend, and one stacked-stick column per date that fills up bottom to top.",
  whenToUse:
    "Use to watch a metered cost (AI tokens, API calls, SMS) over several windows where the reader asks both how much and on what. Not for a single figure with no breakdown (use a metric card), and not as an invoice: it is built to say its numbers are estimates and floors.",
  files: ["registry/items/ai-cost-card/ai-cost-card.tsx"],
  dependencies: ["motion"],
  registryDependencies: ["stick-progress-bar"],
  origin: {
    project: "180Connect",
    path: "src/components/dashboard/ai-spend-overview-preview.tsx",
  },
  credits: [
    {
      name: "Lucide loader-pinwheel icon (paths), animated as in Animate UI's icon",
      url: "https://lucide.dev/icons/loader-pinwheel",
      license: "ISC",
    },
    {
      name: "Animate UI (spin-on-hover icon behaviour)",
      url: "https://animate-ui.com",
      license: "MIT",
    },
  ],
  props: [
    {
      name: "readings",
      type: "AiCostReading[]",
      description:
        "One per window: { id, pill, label, comparison, from, to, costUsd, priorCostUsd, requests, unpriced?, refused?, totalTokens?, models?, byCategory: Record<id, { costUsd, requests }>, spendByDay: { date, byCategory }[], note? }. Switching windows only re-reads these; days missing from spendByDay are drawn empty.",
    },
    {
      name: "categories",
      type: "{ id: string; label: string; color: string }[]",
      description: "The kinds of work, in stacking order (bottom up). Colours are any CSS colour; keep them tokens.",
    },
    { name: "defaultReadingId / onReadingChange", type: "string / (id: string) => void", description: "Starting window and a callback when it changes." },
    { name: "title", type: "ReactNode", description: 'Heading. Default "Estimated AI cost".' },
    { name: "href / linkLabel", type: "string / ReactNode", description: "Header action, rendered as a plain <a> when href is given." },
    { name: "estimateNote", type: "ReactNode", description: "Line under the headline saying the figure is an estimate, not the bill." },
    {
      name: "unpricedNote / refusedNote",
      type: "(count: number) => ReactNode",
      description: "Footer lines for requests with no known cost and requests the provider refused at a usage limit.",
    },
    { name: "formatCost", type: "(value: number) => string", description: 'Money formatting. Default USD to 2dp, "<$0.01" below a cent.' },
  ],
};
