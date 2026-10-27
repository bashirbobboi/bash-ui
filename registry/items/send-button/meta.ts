import type { ItemMeta } from "../../types.ts";

export const meta: ItemMeta = {
  name: "send-button",
  title: "Send button",
  kind: "primitive",
  category: "buttons",
  type: "registry:ui",
  description:
    "A send button whose paper plane bobs, turns and flies forward on hover as the label slides out behind it, with a pending state that holds the plane still.",
  whenToUse:
    "Use for the one action on a screen that sends something out of the app: an email, a message, an invitation. Do not use it for ordinary saves or submits; the flourish only means something if it is rare.",
  files: ["registry/items/send-button/send-button.tsx"],
  dependencies: ["motion", "lucide-react"],
  registryDependencies: [],
  origin: { project: "180Connect", path: "src/components/ui/send-button.tsx" },
  credits: [
    {
      name: "adamgiebl, \"Send\" paper plane button on Uiverse.io (hover choreography: fly-1 bob, 45° turn, label slide)",
      url: "https://uiverse.io/adamgiebl",
      license: "MIT",
    },
  ],
  props: [
    { name: "label", type: "ReactNode", description: 'Resting label. Defaults to "Send".' },
    {
      name: "pending",
      type: "boolean",
      description: "Shows pendingLabel, holds the plane still and disables the button.",
    },
    {
      name: "pendingLabel",
      type: "ReactNode",
      description: 'Label while pending. Defaults to "Sending…".',
    },
    {
      name: "tone",
      type: '"ink" | "lead"',
      description: "Charcoal glass (default) or the lead accent, for light glass surfaces.",
    },
    {
      name: "radius",
      type: '"pill" | "lg"',
      description: "Fully rounded (default) or the theme radius, e.g. as the left half of a split control.",
    },
    { name: "icon", type: "LucideIcon", description: "Optional leading icon before the plane." },
    {
      name: "...button props",
      type: "ButtonHTMLAttributes<HTMLButtonElement>",
      description: "onClick, disabled, title, className (merged, so h-9 or rounded-r-none override cleanly) and the rest.",
    },
  ],
};
