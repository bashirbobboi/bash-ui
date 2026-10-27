import type { ItemMeta } from "../../types.ts";

export const meta: ItemMeta = {
  name: "app-sidebar",
  title: "App sidebar",
  kind: "pattern",
  category: "navigation",
  type: "registry:block",
  description:
    "A frosted app rail: logo and name, labelled sections of nav rows with count pills, a slot for a checklist, a footer with a theme switch, and the account menu. It collapses to icons with tooltips on desktop and becomes a focus-trapping drawer on a phone.",
  whenToUse:
    "Use as the persistent primary navigation of a signed-in app with five to fifteen destinations. Do not use for a marketing site's header, for in-page section tabs, or for settings sub-navigation inside a page.",
  files: ["registry/items/app-sidebar/app-sidebar.tsx"],
  dependencies: ["radix-ui", "motion", "lucide-react"],
  registryDependencies: ["account-menu"],
  origin: {
    project: "180Connect",
    path: "src/components/sidebar.tsx",
  },
  credits: [
    {
      name: "Animate UI (Radix Tooltip, animated icons)",
      url: "https://animate-ui.com",
      license: "MIT",
    },
    {
      name: "AnimateIcons (row-hover icon animation)",
      url: "https://animateicons.in",
      license: "MIT",
    },
  ],
  props: [
    {
      name: "sections",
      type: "{ label?: string; items: SidebarNavItem[] }[]",
      description:
        "The nav. Each item: { href, label, icon, gesture?, count?, countLabel?, active?, matches? }. Pass only the rows this person can open.",
    },
    {
      name: "currentPath",
      type: "string",
      description: "Selects the row whose href (or one of its matches) equals it. A row's own active wins.",
    },
    { name: "logo / title", type: "ReactNode", description: "The 32px mark and the product name at the top." },
    {
      name: "account",
      type: "Omit<AccountMenuProps, \"collapsed\">",
      description: "The account menu at the foot: user, items, onSignOut. Omit for none.",
    },
    {
      name: "footer / children",
      type: "ReactNode | ({ collapsed, mobileOpen }) => ReactNode",
      description:
        "Slots: footer sits above the account menu (theme switch, a bell); children sits between nav and footer (an onboarding checklist).",
    },
    {
      name: "collapsed / defaultCollapsed / onCollapsedChange",
      type: "boolean / boolean / (collapsed: boolean) => void",
      description: "The icon-only rail at md and up. Persist the choice in onCollapsedChange.",
    },
    {
      name: "mobileOpen / onMobileClose / id",
      type: "boolean / () => void / string",
      description: "The phone drawer. Wire to useSidebarDrawer(): { open, setOpen, triggerRef, drawerId }.",
    },
    {
      name: "renderLink",
      type: "(props: SidebarLinkProps) => ReactNode",
      description: "Renders each nav link; defaults to <a>. Pass (p) => <Link {...p} /> for a router.",
    },
    {
      name: "onNavigate",
      type: "(item: SidebarNavItem) => void",
      description: "Called when a row is followed. The drawer closes on its own.",
    },
    {
      name: "SidebarMobileBar / SidebarScrim / SidebarThemeSwitch",
      type: "components",
      description:
        "The phone bar with the burger, the dim layer behind the drawer, and a Light/Dark pill for the footer ({ dark, onDarkChange, collapsed }).",
    },
  ],
};
