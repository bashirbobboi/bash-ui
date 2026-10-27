import type { ItemMeta } from "../../types.ts";

export const meta: ItemMeta = {
  name: "lock-toggle",
  title: "Lock toggle",
  kind: "primitive",
  category: "inputs",
  type: "registry:ui",
  description:
    "A Material Design 3 switch in the theme's tokens whose knob carries a lock when on and an open lock when off, with M3's spring slide, growing knob, rotating icon and pointer halo.",
  whenToUse:
    "Use where flipping it is the save: a protection or setting that applies at once, especially one where turning it off is the risky direction (the default stop tone). Control it with `checked` to hold it on until a confirmation lands. Not for answers in a form submitted later; use a checkbox.",
  files: ["registry/items/lock-toggle/lock-toggle.tsx"],
  dependencies: ["motion", "lucide-react", "class-variance-authority"],
  origin: {
    project: "180Connect",
    path: "src/components/ui/material-design-3-switch.tsx; used in src/app/settings/data-handling-rules/rules-panel.tsx",
  },
  credits: [
    {
      name: "Material Design 3 Switch by Hossain Jahed (EaseMize UI), copied as-is from 21st.dev and restyled with bash-ui tokens. 21st.dev lists its licence as unknown",
      url: "https://21st.dev/@jahed/components/material-design-3-switch",
      license: "unknown",
    },
    {
      name: "Material Design 3: Switch (design spec)",
      url: "https://m3.material.io/components/switch",
    },
  ],
  props: [
    { name: "checked / defaultChecked", type: "boolean", description: "Controlled or uncontrolled state. Controlled holds the knob where the caller says, e.g. on until a confirm." },
    { name: "onCheckedChange", type: "(checked: boolean) => void", description: "Called with the requested state on every flip." },
    { name: "tone", type: "\"stop\" | \"go\" | \"lead\"", description: "Colour of the on state. Default stop: for switches where turning off is the risky direction." },
    { name: "size", type: "\"md\" | \"sm\"", description: "52x32 (M3 standard) or 40x24. Default md." },
    { name: "showIcons", type: "boolean", description: "Show an icon in the knob. Default true." },
    { name: "checkedIcon / uncheckedIcon", type: "ReactNode", description: "Knob icons. Default a closed and an open lock." },
    { name: "haptic", type: "\"none\" | \"light\" | \"heavy\"", description: "A synthesised Web Audio click on toggle. Default none." },
    { name: "disabled", type: "boolean", description: "Greys it out and ignores input." },
    { name: "...input props", type: "InputHTMLAttributes", description: "id, name, aria-label, aria-describedby and the rest go to the hidden checkbox (role=\"switch\")." },
  ],
};
