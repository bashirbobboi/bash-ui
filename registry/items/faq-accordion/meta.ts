import type { ItemMeta } from "../../types.ts";

export const meta: ItemMeta = {
  name: "faq-accordion",
  previewGrow: true,
  title: "FAQ accordion",
  kind: "pattern",
  category: "lists",
  type: "registry:block",
  description:
    "A question-and-answer accordion whose organic, hand-cut plus turns its upright bar flat into a minus as the answer unblurs open beneath it.",
  whenToUse:
    "Use for FAQs and other short, scannable question lists where each answer is a paragraph or two. Do not use it to hide primary content or long forms; anything most readers need should be visible without a press.",
  files: ["registry/items/faq-accordion/faq-accordion.tsx"],
  dependencies: ["motion", "radix-ui"],
  registryDependencies: [],
  origin: { project: "Steeze", path: "src/components/ui/accordion.jsx + trih-icons.jsx + faq-section.jsx" },
  credits: [
    {
      name: "The Rest Is History club FAQ: plus and minus bar artwork (the SVG path matches therestishistory.com/club exactly)",
      url: "https://therestishistory.com/club",
      license: "unknown",
    },
    {
      name: "shadcn/ui Accordion (Root, Item, Trigger and Content structure over Radix)",
      url: "https://ui.shadcn.com/docs/components/accordion",
      license: "MIT",
    },
  ],
  props: [
    {
      name: "items",
      type: "{ id: string; question: ReactNode; answer: ReactNode; disabled?: boolean }[]",
      description: "The questions and answers, in order. Each id is the value reported when it opens.",
    },
    { name: "type", type: '"single" | "multiple"', description: "One answer open at a time (default) or any number." },
    {
      name: "collapsible",
      type: "boolean",
      description: "Single mode only: whether pressing the open question closes it again. Defaults to true.",
    },
    {
      name: "defaultValue",
      type: "string | string[]",
      description: "The id (single) or ids (multiple) open at first, when uncontrolled.",
    },
    {
      name: "value",
      type: "string | string[]",
      description: "The open id or ids, when controlled. Pair with onValueChange.",
    },
    {
      name: "onValueChange",
      type: "(value: string | string[]) => void",
      description: "Called with the new open id (single, \"\" when closed) or ids (multiple).",
    },
    { name: "iconSize", type: "number", description: "Side of the plus/minus mark in pixels. Defaults to 24." },
    { name: "disabled", type: "boolean", description: "Disables every question." },
  ],
};
