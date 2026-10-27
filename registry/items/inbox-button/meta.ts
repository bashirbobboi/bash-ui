import type { ItemMeta } from "../../types.ts";

export const meta: ItemMeta = {
  name: "inbox-button",
  title: "Inbox button",
  kind: "primitive",
  category: "buttons",
  type: "registry:ui",
  description:
    "A shortcut button to an inbox whose tray glyph dips and redraws on hover or focus, with a slim four-colour provider rail along its bottom edge and an optional unread count.",
  whenToUse:
    "Use as the one way into a mail inbox from a dashboard or header, where naming the mail provider by colour helps. Do not use for general navigation; a plain link or nav item is quieter.",
  files: ["registry/items/inbox-button/inbox-button.tsx"],
  dependencies: ["motion"],
  registryDependencies: [],
  origin: { project: "180Connect", path: "src/components/dashboard/dashboard-inbox-button.tsx" },
  credits: [
    {
      name: "AnimateIcons (Avijit Dey), lucide/inbox-icon animation",
      url: "https://github.com/Avijit07x/animateicons",
      license: "MIT",
    },
    {
      name: "Lucide, inbox icon paths",
      url: "https://lucide.dev",
      license: "ISC",
    },
  ],
  props: [
    { name: "href", type: "string", description: "Renders an <a> to the inbox. Omit for a <button>." },
    { name: "onClick", type: "MouseEventHandler<HTMLElement>", description: "Click handler for either element." },
    { name: "label", type: "ReactNode", description: 'Defaults to "View inbox".' },
    {
      name: "unreadCount",
      type: "number",
      description: "Unread messages; a small lead badge after the label when above zero.",
    },
    { name: "maxCount", type: "number", description: 'Counts above it read as "99+". Defaults to 99.' },
    {
      name: "providerColors",
      type: "[string, string, string, string]",
      description:
        "Rail colours in order; the first is the glyph at rest, the second on hover. Defaults read --provider-blue/red/yellow/green, falling back to lead, stop, hold and go. Set those variables to Google's colours for the original look.",
    },
    { name: "className", type: "string", description: "Classes for the button." },
  ],
};
