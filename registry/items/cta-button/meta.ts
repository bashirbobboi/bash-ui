import type { ItemMeta } from "../../types.ts";

export const meta: ItemMeta = {
  name: "cta-button",
  title: "CTA button",
  kind: "primitive",
  category: "buttons",
  type: "registry:ui",
  description:
    "A glass label pill and an accent disc touching at one point; on hover the pair lifts, the disc swallows its ring, the accent washes across the label and the arrow loops through the disc.",
  whenToUse:
    "Use for the single action that matters on a public or marketing screen (Get started, Go to app, Log in), one per screen. Do not use inside a dense app screen or for secondary actions; the effect is a signature and wears out when repeated.",
  files: ["registry/items/cta-button/cta-button.tsx"],
  dependencies: ["motion"],
  registryDependencies: [],
  origin: { project: "180Connect", path: "src/components/brand/brand-cta.tsx" },
  credits: [],
  props: [
    { name: "label", type: "ReactNode", description: 'Text on the pill. Defaults to "Get Started".' },
    {
      name: "tone",
      type: '"glass" | "sheet"',
      description: "glass (default) for a light page; sheet for a solid ink surface such as an open menu.",
    },
    { name: "size", type: '"sm" | "lg"', description: "lg (default) is the 40px hero pair; sm the 36px nav pair." },
    { name: "href", type: "string", description: "Given, renders an <a>; omitted, renders a <button>." },
    {
      name: "type",
      type: '"submit" | "button"',
      description: 'Button only. Defaults to "submit".',
    },
    {
      name: "disabled",
      type: "boolean",
      description: "Button only. Dims it and drops the hover chain rather than running it on a dead control.",
    },
    { name: "onClick", type: "MouseEventHandler<HTMLElement>", description: "Click handler for either element." },
    { name: "aria-label / aria-describedby", type: "string", description: "Passed through to the element." },
    { name: "className", type: "string", description: "Classes for the outer element." },
  ],
};
