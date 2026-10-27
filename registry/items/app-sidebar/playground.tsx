"use client";

import type { PlaygroundSpec } from "../../types.ts";
import { paths, SidebarFrame } from "./fixtures.tsx";

export const playground: PlaygroundSpec = {
  component: "AppSidebar",
  controls: [
    { type: "boolean", name: "defaultCollapsed", label: "Collapsed (desktop)", default: false },
    { type: "select", name: "currentPath", label: "Current page", options: paths, default: "/dashboard" },
    { type: "text", name: "title", label: "Title", default: "180Connect" },
  ],
  render: (values) => (
    // Keyed on the starting state: both only count on mount, and the frame
    // keeps its own selection after that so rows stay clickable.
    <SidebarFrame
      key={`${values.defaultCollapsed}:${values.currentPath}`}
      defaultCollapsed={Boolean(values.defaultCollapsed)}
      currentPath={String(values.currentPath)}
      title={String(values.title)}
    />
  ),
  codeProps: ["sections={sections}", "logo={<Logo />}", "account={account}"],
};
