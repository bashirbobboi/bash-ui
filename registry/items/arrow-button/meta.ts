import type { ItemMeta } from "../../types.ts";

export const meta: ItemMeta = {
  name: "arrow-button",
  title: "Arrow button",
  kind: "primitive",
  category: "buttons",
  type: "registry:ui",
  description:
    "A pill whose small dot blooms to fill it on hover while the label slides out and returns beside an up-right arrow in inverted colours, without the pill changing width.",
  whenToUse:
    "Use for a page's main outbound call to action, such as Download or Sign up: solid in the hero, outlined in the navigation. Do not use for form submits or dense app toolbars; the bloom is a marketing flourish and loses its point when repeated.",
  files: ["registry/items/arrow-button/arrow-button.tsx"],
  dependencies: ["lucide-react", "motion"],
  registryDependencies: [],
  origin: { project: "Steeze", path: "src/components/ui/interactive-hover-button.jsx" },
  credits: [
    {
      name: "Magic UI, Interactive Hover Button (dot bloom and label swap; Steeze added the in-flow sizer, outline variant and up-right arrow)",
      url: "https://magicui.design/docs/components/arrow-button",
      license: "MIT",
    },
  ],
  props: [
    { name: "label", type: "ReactNode", description: 'The label, at rest and beside the arrow on hover. Defaults to "Download Now".' },
    {
      name: "variant",
      type: '"solid" | "outline"',
      description: "solid (default): primary fill blooming into the page colour. outline: a hairline blooming into the primary fill.",
    },
    { name: "size", type: '"sm" | "md" | "lg"', description: "36px, 40px (default) or 48px tall." },
    { name: "href", type: "string", description: "Given, renders an <a>; omitted, renders a <button>." },
    {
      name: "...anchor or button props",
      type: "AnchorHTMLAttributes | ButtonHTMLAttributes",
      description: "onClick, target, rel, disabled (button only), className (merged) and the rest; the ref reaches the element.",
    },
  ],
};
