import type { ItemMeta } from "../../types.ts";

export const meta: ItemMeta = {
  name: "account-menu",
  title: "Account menu",
  kind: "widget",
  category: "overlays",
  type: "registry:component",
  description:
    "The account block at the foot of an app rail: avatar, name and role, opening upward into a frosted menu with the email, a highlight that slides between rows, icons that gesture as it lands, and a red Log out.",
  whenToUse:
    "Use for the signed-in person's own menu (profile, settings, help, sign out) at the foot or top of a sidebar or header. Do not use for menus about content on the page, or for more than a handful of rows; that is a plain dropdown or a settings page.",
  files: ["registry/items/account-menu/account-menu.tsx"],
  dependencies: ["radix-ui", "motion", "lucide-react"],
  origin: {
    project: "180Connect",
    path: "src/components/sidebar-account-menu.tsx",
  },
  credits: [
    {
      name: "Animate UI (Radix Dropdown Menu, Highlight, animated icons)",
      url: "https://animate-ui.com",
      license: "MIT",
    },
  ],
  props: [
    {
      name: "user",
      type: "{ name?: string | null; email?: string | null; role?: string | null; avatarUrl?: string | null }",
      description:
        "Who is signed in. The row shows name (falling back to email) and role; the menu header adds the email. Initials stand in without a photo.",
    },
    {
      name: "items",
      type: '(AccountMenuItem | "separator")[]',
      description:
        "Rows between the header and Log out: { label, icon?, gesture?, href?, onSelect?, destructive?, disabled? }. \"separator\" draws a hairline.",
    },
    {
      name: "onSignOut",
      type: "() => void | Promise<void>",
      description: "Adds a red Log out row at the foot. Omit to leave it out.",
    },
    {
      name: "signOutLabel",
      type: "ReactNode",
      description: 'Label for the sign-out row. Defaults to "Log out".',
    },
    {
      name: "onNavigate",
      type: "(href: string) => void",
      description:
        "For client-side routers: called instead of a page load when a row with an href is chosen. Modified clicks still open a new tab.",
    },
    {
      name: "collapsed",
      type: "boolean",
      description: "Avatar-only trigger at md and up, for a collapsed rail. Below md the name always shows.",
    },
    {
      name: "side / align",
      type: '"top" | "bottom" | "left" | "right" / "start" | "center" | "end"',
      description: 'Where the menu opens. Defaults to "top" / "start", for the foot of a rail.',
    },
    {
      name: "IconGesture",
      type: '"bob" | "spin" | "wiggle" | "sway" | "nudge" | "nudge-back" | "drop" | "brace" | "tilt" | "pop" | "own" | "none"',
      description:
        "How a row's icon moves while highlighted; \"own\" hands a self-animating icon (Animate UI) animate instead. Exported with GestureGlyph and ICON_GESTURES so a sidebar can drive its rows the same way.",
    },
    { name: "className / contentClassName", type: "string", description: "Classes for the trigger row / the menu." },
  ],
};
