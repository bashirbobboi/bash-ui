import type { ItemMeta } from "../../types.ts";

export const meta: ItemMeta = {
  name: "checkbox",
  title: "Checkbox",
  kind: "primitive",
  category: "inputs",
  type: "registry:ui",
  description:
    "An animated checkbox: the box springs on hover and press, fills with the lead colour, and the tick draws itself in.",
  whenToUse:
    "Use for any yes/no or multi-select choice instead of a native checkbox, which ignores theme tokens. Pair it with a <label htmlFor>; for a single on/off setting that takes effect immediately, a switch reads better.",
  files: ["registry/items/checkbox/checkbox.tsx"],
  dependencies: ["radix-ui", "motion", "class-variance-authority"],
  origin: {
    project: "180Connect",
    path: "src/components/ui/filed-checkbox.tsx",
  },
  credits: [
    {
      name: "Animate UI (Radix Checkbox)",
      url: "https://animate-ui.com",
      license: "MIT",
    },
  ],
  props: [
    {
      name: "checked",
      type: 'boolean | "indeterminate"',
      description: "Controlled state. Omit and use defaultChecked to let it manage itself.",
    },
    {
      name: "defaultChecked",
      type: 'boolean | "indeterminate"',
      description: "Starting state when uncontrolled.",
    },
    {
      name: "onCheckedChange",
      type: '(checked: boolean | "indeterminate") => void',
      description: "Called with the new state on every toggle.",
    },
    {
      name: "size",
      type: '"sm" | "default" | "lg"',
      description: "18, 20 or 24px box. Defaults to sm.",
    },
    {
      name: "disabled",
      type: "boolean",
      description: "Dims the box and refuses clicks.",
    },
    {
      name: "id / name / value / required",
      type: "string / string / string / boolean",
      description: "Passed to Radix, so the checkbox posts with a form and a label can point at it.",
    },
  ],
};
