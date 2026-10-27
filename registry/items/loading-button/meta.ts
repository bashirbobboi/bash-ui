import type { ItemMeta } from "../../types.ts";

export const meta: ItemMeta = {
  name: "loading-button",
  title: "Loading button",
  kind: "widget",
  category: "buttons",
  type: "registry:component",
  description:
    "A compact solid button for one async job: its icon spins and its label swaps while the work runs, then a short go or stop status line says how it went.",
  whenToUse:
    "Use for an on-demand fetch, refresh or re-check the user triggers mid-task, where the outcome is worth a one-line answer. Do not use for form submission or navigation, or for data the page needs to render; fetch that on the page.",
  files: ["registry/items/loading-button/loading-button.tsx"],
  dependencies: ["motion", "lucide-react"],
  origin: {
    project: "180Connect",
    path: "src/app/(app)/clients/[id]/grant-fetch-button.tsx",
  },
  credits: [],
  props: [
    {
      name: "onAction",
      type: "() => Promise<{ ok: boolean; message?: string } | void>",
      description:
        "The work. Resolving with nothing means success; rejecting or returning ok: false means failure. A returned message replaces the default status text.",
    },
    { name: "label", type: "ReactNode", description: "Resting label: what pressing it will do." },
    {
      name: "pendingLabel",
      type: "ReactNode",
      description: 'Label while the action runs. Defaults to "Working…".',
    },
    {
      name: "successLabel",
      type: "ReactNode",
      description: 'Status after success when the action returns no message. Defaults to "Done".',
    },
    {
      name: "errorLabel",
      type: "ReactNode",
      description: "Status after failure when the action returns no message, or throws.",
    },
    {
      name: "icon",
      type: "LucideIcon",
      description: "Icon that spins while pending. Defaults to RefreshCw.",
    },
    { name: "disabled", type: "boolean", description: "Refuses presses." },
    { name: "className", type: "string", description: "Classes for the outer row." },
  ],
};
