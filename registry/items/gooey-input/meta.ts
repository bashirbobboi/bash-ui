import type { ItemMeta } from "../../types.ts";

export const meta: ItemMeta = {
  name: "gooey-input",
  title: "Gooey input",
  kind: "primitive",
  category: "inputs",
  type: "registry:ui",
  description:
    "A pill text field whose submit button is a droplet of the same liquid: on focus it pulls away from the capsule through a gooey SVG bridge and lands beside it with its icon.",
  whenToUse:
    "Reach for it for a single-value action field that deserves a moment of delight: a sign-up email, a URL to import, an inline rename. Not for multi-field forms, where a plain input and one submit button read better, and not inside overflow-hidden containers that would clip the droplet's travel.",
  files: [
    "registry/items/gooey-input/gooey-input.tsx",
  ],
  dependencies: ["motion", "lucide-react"],
  origin: {
    project: "180Connect",
    path: "src/components/ui/gooey-text-input.tsx (+ src/components/ui/gooey-email-input.tsx)",
  },
  credits: [
    {
      name: "liquid-gooey by Jakub Antalik (goo filter, silhouette/content layering, shadow-on-merged-silhouette passes)",
      url: "https://gooey.jakubantalik.com",
      license: "MIT",
    },
  ],
  props: [
    { name: "type", type: '"text" | "email" | "url" | "search" | "tel"', description: "Input type. `email` turns on the built-in email check." },
    { name: "value / defaultValue / onValueChange", type: "string / string / (v: string) => void", description: "Controlled or uncontrolled value; onValueChange fires on every keystroke in both modes." },
    { name: "onSubmit", type: "(value: string) => void | Promise<void>", description: "Enter or droplet tap, after validation. A returned promise drives the spinner, then a tick or failureMessage. Omit it to submit the enclosing form." },
    { name: "validate", type: "(value: string) => string | null", description: "Sync check before submit; return a message to show. Defaults to an email check for type=\"email\"." },
    { name: "validateAsync", type: "(value: string) => Promise<string | null>", description: "Debounced live check while typing; the droplet spins, then shows a tick when it passes." },
    { name: "label", type: "string", description: "Floating label that rides onto the capsule's top edge on focus or value." },
    { name: "restLabel", type: "string", description: "Button-face title shown while empty and blurred; focusing turns it into a field." },
    { name: "pending", type: "boolean", description: "External busy flag (a form action in flight): droplet stays out and spins, field disables." },
    { name: "name", type: "string", description: "Mirrors the value into a hidden input so it posts with the enclosing form." },
    { name: "buttonIcon", type: '"arrow" | "send" | "sparkles" | "check" | "x" | "plus"', description: "The droplet's icon." },
    { name: "loadingIcon", type: '"spinner" | "square"', description: "Busy face: a spinner or a glowing rolling square in the lead colour." },
    { name: "onDropletClick", type: "() => void", description: "Replaces submit on a droplet tap (e.g. an x that dismisses the field). Enter still submits." },
    { name: "onEscape", type: "() => void", description: "Escape while focused." },
    { name: "size / fieldWidth", type: '"sm" | "md" | "lg" / number', description: "Height preset and capsule width in px (defaults 190 / 240 / 270)." },
    { name: "align / fluid", type: '"center" | "start" / boolean', description: "Centre in a roomy stage, pin to the row's left edge (shrinking on narrow rows), or fill the parent's width." },
    { name: "feel", type: '"calm" | "bouncy"', description: "Droplet travel: 640ms without overshoot, or 380ms with overshoot." },
    { name: "gooBlur / gooContrast / gap", type: "number", description: "How far pieces bridge (6), how sharp the liquid edge is (14), how far the droplet travels in px (54)." },
  ],
};
