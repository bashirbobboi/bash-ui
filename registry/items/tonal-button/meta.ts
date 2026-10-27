import type { ItemMeta } from "../../types.ts";

export const meta: ItemMeta = {
  name: "tonal-button",
  title: "Tonal button",
  kind: "primitive",
  category: "buttons",
  type: "registry:ui",
  description:
    "A filled secondary button in two quiet fills: a tinted tonal fill and a neutral secondary one, as in Steeze's Earnings and Edit Profile pair.",
  whenToUse:
    "Use for actions that sit beside or below a primary one and still need to read as buttons, such as profile shortcuts or a pair of settings. Not for the main call to action on a screen, and not for destructive actions.",
  files: ["registry/items/tonal-button/tonal-button.tsx"],
  dependencies: [],
  registryDependencies: [],
  origin: { project: "Steeze", path: "app_steeze: app/(root)/(tabs)/profile.tsx (Earnings and Edit Profile buttons)" },
  credits: [],
  props: [
    { name: "label", type: "ReactNode", description: 'The label. Defaults to "Earnings".' },
    {
      name: "tone",
      type: '"tonal" | "secondary"',
      description: "tonal: the tinted fill (default, Earnings). secondary: the neutral fill (Edit Profile), slightly narrower padding.",
    },
    {
      name: "...button props",
      type: "ButtonHTMLAttributes<HTMLButtonElement>",
      description: "onClick, disabled, type, className (merged) and the rest.",
    },
  ],
};
