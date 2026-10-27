import type { ItemMeta } from "../../types.ts";

export const meta: ItemMeta = {
  name: "notification-toggle",
  title: "Notification toggle",
  kind: "primitive",
  category: "inputs",
  type: "registry:ui",
  description:
    "Steeze's SMS notification switch: a pale knob on a grey track when off, a charcoal knob on lilac when on, adapted from React Native to a keyboard-accessible web control.",
  whenToUse:
    "Use for notification preferences and other settings that apply immediately. Pass checked and onCheckedChange for caller-owned state, or defaultChecked for an uncontrolled switch. Supply aria-label or aria-labelledby.",
  files: ["registry/items/notification-toggle/notification-toggle.tsx"],
  dependencies: ["motion"],
  registryDependencies: [],
  origin: {
    project: "Steeze",
    path: "app_steeze: app/(root)/notification-preferences.tsx (SMS Notifications Switch)",
  },
  credits: [
    {
      name: "React Native Switch: the mobile app's native control, re-created for the web",
      url: "https://github.com/facebook/react-native",
      license: "MIT",
    },
  ],
  props: [
    { name: "checked", type: "boolean", description: "Controlled on/off state." },
    { name: "defaultChecked", type: "boolean", description: "Initial uncontrolled state. Defaults to off." },
    { name: "onCheckedChange", type: "(checked: boolean) => void", description: "Receives the requested state on pointer or keyboard activation." },
    { name: "disabled", type: "boolean", description: "Dims the switch and prevents interaction." },
    { name: "aria-label / aria-labelledby", type: "string", description: "Names the switch for assistive technology." },
    { name: "...input props", type: "InputHTMLAttributes<HTMLInputElement>", description: "Native id, name, value, required and form props go to the checkbox. className and style apply to the outer label." },
  ],
};
