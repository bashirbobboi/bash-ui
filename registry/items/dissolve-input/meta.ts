import type { ItemMeta } from "../../types.ts";
export const meta: ItemMeta = {
  "name": "dissolve-input",
  "title": "Dissolve input",
  "kind": "primitive",
  "category": "inputs",
  "type": "registry:ui",
  "description": "Ledge’s underlined login input, whose text dissolves into particles from right to left with a visible action button, on Enter or after a confirmed action.",
  "whenToUse": "Use for a single-value submission or a success transition. Enter previews the effect; in a login form set dissipateOnEnter={false} and call ref.dissipate() only after authentication succeeds. Completion clears the controlled value, allowing another attempt.",
  "files": [
    "registry/items/dissolve-input/dissolve-input.tsx"
  ],
  "dependencies": [
    "motion",
    "lucide-react"
  ],
  "origin": {
    "project": "Ledge",
    "path": "src/components/dissipate-input.tsx; src/app/login/page.tsx"
  },
  "credits": [],
  "props": [
    { "name": "submitLabel", "type": "string", "description": "Accessible name for the icon-only Enter action; defaults to Submit. Hidden when dissipateOnEnter is false." },
    {
      "name": "value",
      "type": "string",
      "description": "Controlled input value."
    },
    {
      "name": "onChange",
      "type": "(value: string) => void",
      "description": "Reports edits and clears the value on completion."
    },
    {
      "name": "onSubmit",
      "type": "(value: string) => void | boolean | Promise<void | boolean>",
      "description": "Called on Enter. Return false to keep the text and skip the effect."
    },
    {
      "name": "dissipateOnEnter",
      "type": "boolean",
      "description": "Defaults to true. Disable for parent-controlled form submission."
    },
    {
      "name": "onDissipated",
      "type": "() => void",
      "description": "Called when the animation completes."
    },
    {
      "name": "mask",
      "type": "boolean",
      "description": "Use bullets for the particles; password inputs always mask."
    },
    {
      "name": "ref",
      "type": "Ref<DissolveInputHandle>",
      "description": "Exposes dissipate(), focus() and getValue() for confirmed actions and autofill."
    },
    {
      "name": "type / placeholder / disabled",
      "type": "Native input props",
      "description": "Email, password or text behaviour, prompt and disabled state."
    }
  ]
};
