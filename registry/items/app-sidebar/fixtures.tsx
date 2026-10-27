"use client";

import { useEffect, useRef, useState, type ComponentType, type Ref } from "react";
import { InboxIcon } from "@animateicons/react/lucide/inbox-icon";
import { ListChecksIcon } from "@animateicons/react/lucide/list-checks-icon";

import { ChartColumn } from "@/components/animate-ui/icons/chart-column";
import { CloudDownload } from "@/components/animate-ui/icons/cloud-download";
import { Compass } from "@/components/animate-ui/icons/compass";
import { MessageCircleQuestion } from "@/components/animate-ui/icons/message-circle-question";
import { Settings } from "@/components/animate-ui/icons/settings";
import { User } from "@/components/animate-ui/icons/user";
import { UsersGroupIcon } from "@/components/animate-ui/icons/users-group";
import { AppSidebar, type AppSidebarProps, type SidebarSection } from "./app-sidebar.tsx";

type AnimateIconsHandle = { startAnimation: () => void; stopAnimation: () => void };

/**
 * AnimateIcons glyphs are driven through a ref, not a prop, so this turns the
 * sidebar's `animate` into start / stop calls. `size` is pinned to 20: the svg
 * reads it, not the class, and the default 24 would spill past the row's box.
 */
function drivenByRef(
  Icon: ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean; ref?: Ref<AnimateIconsHandle> }>,
) {
  return function DrivenIcon({ animate, className }: { animate?: boolean; className?: string }) {
    const handle = useRef<AnimateIconsHandle>(null);
    useEffect(() => {
      if (animate) handle.current?.startAnimation();
      else handle.current?.stopAnimation();
    }, [animate]);
    return <Icon ref={handle} size={20} className={className} aria-hidden={true} />;
  };
}

const Inbox = drivenByRef(InboxIcon);
const ListChecks = drivenByRef(ListChecksIcon);

// 180Connect's rail with its own animated icons, cut to what fits a 460px box
// without the nav scrolling. Each icon draws its own motion ("own").
export const sections: SidebarSection[] = [
  {
    items: [
      { href: "/dashboard", label: "Dashboard", icon: Compass, gesture: "own" },
      { href: "/tasks", label: "Tasks", icon: ListChecks, gesture: "own", count: 3 },
      { href: "/inbox", label: "Inbox", icon: Inbox, gesture: "own", count: 12, countLabel: "12 unread" },
      { href: "/clients", label: "Clients", icon: UsersGroupIcon, gesture: "own" },
      { href: "/imports", label: "Data imports", icon: CloudDownload, gesture: "own" },
      { href: "/analytics", label: "Analytics", icon: ChartColumn, gesture: "own" },
    ],
  },
];

export const paths = sections.flatMap((section) => section.items.map((item) => item.href));

const account: NonNullable<AppSidebarProps["account"]> = {
  user: { name: "Amara Okafor", email: "amara.okafor@northwind.org", role: "Admin" },
  items: [
    { label: "Profile", icon: User, gesture: "own" },
    { label: "Settings", icon: Settings, gesture: "own" },
    { label: "Help", icon: MessageCircleQuestion, gesture: "own" },
  ],
  onSignOut: () => {},
};

/** The 180DC globe, as on 180Connect. Gallery only: it is 180DC's mark, not part of the component. */
function Mark() {
  // eslint-disable-next-line @next/next/no-img-element -- a fixed 32px mark; next/image adds nothing here
  return <img src="/demo/180dc-globe.png" alt="" className="size-8 object-contain" />;
}

/**
 * The rail alone in a fixed-height box. The box is positioned and `isolate`,
 * so the green wash (`wash="absolute"`) pools behind the rail and stays in the
 * box; its transform makes it the containing block for the rail's `fixed`
 * phone drawer, so below `md` the drawer opens inside the tile, not over the
 * page. Rows select without navigating.
 */
export function SidebarFrame({
  defaultCollapsed = false,
  currentPath = "/dashboard",
  title = "180Connect",
}: {
  defaultCollapsed?: boolean;
  currentPath?: string;
  title?: string;
}) {
  const [path, setPath] = useState(currentPath);
  const [drawerOpen, setDrawerOpen] = useState(true);

  // Below `md` the rail is a drawer. Closing it (the X, or following a row)
  // slides it out, then back in, so the tile is never left empty.
  useEffect(() => {
    if (drawerOpen) return;
    const timer = window.setTimeout(() => setDrawerOpen(true), 700);
    return () => window.clearTimeout(timer);
  }, [drawerOpen]);

  return (
    <div className="relative isolate h-[460px] w-64 max-w-full overflow-hidden rounded-panel [transform:translateZ(0)] md:w-auto">
      <AppSidebar
        className="h-full"
        sections={sections}
        currentPath={path}
        logo={<Mark />}
        title={title}
        account={account}
        wash="absolute"
        defaultCollapsed={defaultCollapsed}
        mobileOpen={drawerOpen}
        onMobileClose={() => setDrawerOpen(false)}
        onNavigate={(item) => setPath(item.href)}
        renderLink={(props) => (
          <a
            {...props}
            onClick={(event) => {
              event.preventDefault();
              props.onClick?.(event);
            }}
          />
        )}
      />
    </div>
  );
}
