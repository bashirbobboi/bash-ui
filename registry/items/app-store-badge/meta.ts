import type { ItemMeta } from "../../types.ts";

export const meta: ItemMeta = {
  name: "app-store-badge",
  title: "App store badge",
  kind: "primitive",
  category: "buttons",
  type: "registry:ui",
  description:
    "A two-line App Store or Google Play badge in the theme's ink: the store's glyph, a small lead-in and the store's name, solid or outlined.",
  whenToUse:
    "Use on a landing or download page to send people to an app's store listing; place one per store side by side. Apple's and Google's marketing guidelines may require their official badge artwork for store listings and adverts, so swap in the official badges where those guidelines apply.",
  files: ["registry/items/app-store-badge/app-store-badge.tsx"],
  dependencies: [],
  registryDependencies: [],
  origin: {
    project: "Steeze",
    path: "src/components/ui/contact-form.jsx (App Store and Google Play image badges; redrawn in theme tokens for bash-ui)",
  },
  credits: [
    {
      name: "Simple Icons: Apple and Google Play glyphs (trademarks of Apple Inc. and Google LLC)",
      url: "https://simpleicons.org",
      license: "CC0-1.0",
    },
  ],
  props: [
    { name: "store", type: '"app-store" | "google-play"', description: "Which store the badge links to. Sets the glyph and wording." },
    { name: "href", type: "string", description: "The app's listing on that store." },
    {
      name: "variant",
      type: '"solid" | "outline"',
      description: "An ink fill (default), or an ink hairline that fills on hover.",
    },
    { name: "shape", type: '"inset" | "pill"', description: "The theme's inset radius (default) or a full pill." },
    { name: "newTab", type: "boolean", description: "Open the listing in a new tab with rel=\"noopener noreferrer\". Defaults to true." },
    {
      name: "...anchor props",
      type: "AnchorHTMLAttributes<HTMLAnchorElement>",
      description: "onClick (for analytics), className and the rest.",
    },
  ],
};
