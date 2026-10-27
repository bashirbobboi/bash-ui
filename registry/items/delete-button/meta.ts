import type { ItemMeta } from "../../types.ts";

export const meta: ItemMeta = {
  name: "delete-button",
  title: "Delete button",
  kind: "widget",
  category: "buttons",
  type: "registry:component",
  description:
    "A two-step delete (Delete, then Confirm with an X to back out) that ends in a Thanos snap: the button tears into dust through an SVG displacement filter. Ships with ThanosSnapEffect, a wrapper that snaps anything else the same way.",
  whenToUse:
    "Use for deleting one row, card or version in place, where a modal confirm would be heavy and the user should feel the thing go. Remove the row in onComplete, never in onConfirm. Not for bulk deletes, for anything that cannot be undone and deserves a typed confirmation, or inside a container that clips overflow tightly, which cuts the dust off.",
  files: [
    "registry/items/delete-button/delete-button.tsx",
    "registry/items/delete-button/thanos-snap-effect.tsx",
  ],
  dependencies: ["motion", "lucide-react"],
  origin: {
    project: "180Connect",
    path: "src/components/ui/delete-button.tsx (+ src/components/ui/thanos-snap-effect.tsx)",
  },
  credits: [
    {
      name: "Mikhail Bespalov, \"Thanos snap\" dissolve CodePen (the displacement-filter dissolve)",
      url: "https://codepen.io/Mikhail-Bespalov/pen/yLmpxOG",
      license: "MIT",
    },
  ],
  props: [
    {
      name: "onConfirm",
      type: "() => void | Promise<void>",
      description:
        "The delete. Runs alongside the snap and the button waits for both. Handle failures inside it and remount the button through its key; a throw brings it back idle and goes to onError.",
    },
    {
      name: "onComplete",
      type: "() => void",
      description: "The dissolve has finished. Remove the deleted row here; removing it earlier cuts the snap dead.",
    },
    { name: "onCancel", type: "() => void", description: "Backed out by the X, Escape, or autoResetTimeout." },
    { name: "onStartConfirm", type: "() => void", description: "The button armed itself." },
    { name: "onError", type: "(error: unknown) => void", description: "onConfirm threw. Without it the error is rethrown." },
    { name: "variant", type: '"solid" | "subtle"', description: "Filled stop colour, or a stop wash for inside a card. Defaults to solid." },
    { name: "size", type: '"xs" | "sm" | "md" | "lg"', description: "Defaults to md." },
    { name: "label / confirmLabel / deletingLabel", type: "ReactNode", description: 'The three states. Default "Delete", "Confirm", "Deleting…". The button holds the width of the wider resting label.' },
    { name: "deletingDuration", type: "number", description: "Milliseconds the Deleting… state holds before the snap. Defaults to 650." },
    { name: "snapOnConfirm", type: "boolean", description: "Dissolve on confirm. Defaults to true; false gives a plain two-step confirm, e.g. when a wrapping ThanosSnapEffect does the snapping." },
    { name: "vanishOnComplete", type: "boolean", description: "Stay gone once done. Defaults to true; false returns to idle." },
    { name: "autoResetTimeout", type: "number", description: "Milliseconds before an armed button disarms. 0 (default) never does." },
    { name: "disabled / loading", type: "boolean", description: "Refuse presses; loading holds it disabled from outside." },
    {
      name: "ThanosSnapEffect",
      type: "{ children, triggerOnClick?, trigger?, onComplete?, resetDelay?: number | null, className? } + ref { snap(): Promise<void>; reset() }",
      description:
        "Wraps anything and dissolves it on ref.snap(), trigger, or click. Pass resetDelay={null} for a delete so it stays dissolved while its row folds away.",
    },
  ],
};
