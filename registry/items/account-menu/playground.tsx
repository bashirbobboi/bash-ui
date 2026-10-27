"use client";

import type { PlaygroundSpec } from "../../types.ts";
import { AccountMenu } from "./account-menu.tsx";
import { items, signOut, user } from "./fixtures.ts";

type Side = "top" | "bottom" | "left" | "right";
type Align = "start" | "center" | "end";

export const playground: PlaygroundSpec = {
  component: "AccountMenu",
  controls: [
    { type: "boolean", name: "collapsed", label: "Collapsed (avatar only, desktop)", default: false },
    { type: "select", name: "side", label: "Opens on", options: ["top", "bottom", "left", "right"], default: "top" },
    { type: "select", name: "align", label: "Align", options: ["start", "center", "end"], default: "start" },
    { type: "text", name: "signOutLabel", label: "Sign-out label", default: "Log out" },
  ],
  render: (values) => (
    // A rail's width, or a collapsed rail's from `md` up (below it the name always shows).
    <div className={values.collapsed ? "w-64 max-w-full md:w-12" : "w-64 max-w-full"}>
      <AccountMenu
        user={user}
        items={items}
        onSignOut={signOut}
        collapsed={Boolean(values.collapsed)}
        side={values.side as Side}
        align={values.align as Align}
        signOutLabel={String(values.signOutLabel)}
      />
    </div>
  ),
  codeProps: ["user={user}", "items={items}", "onSignOut={signOut}"],
};
