"use client";
import type { PlaygroundSpec } from "../../types.ts";
import { ExpandingMenu } from "./expanding-menu";
import { items } from "./fixtures";
export const playground: PlaygroundSpec = {
  component: "ExpandingMenu",
  controls: [
    { type: "text", name: "label", label: "Label", default: "Menu" },
    { type: "select", name: "align", label: "Anchored edge", options: ["left", "right"], default: "left" },
    { type: "text", name: "footer", label: "Footer", default: "Sign out" },
  ],
  render: values => (
    <div className="flex w-[300px] max-w-full" style={{ height: 56 + items.length * 46 + (values.footer ? 84 : 28), justifyContent: values.align === "right" ? "flex-end" : "flex-start" }}>
      <ExpandingMenu items={items} label={String(values.label)} align={values.align as "left" | "right"} footer={String(values.footer) || undefined} onNavigate={(_, event) => event.preventDefault()} />
    </div>
  ),
  codeProps: ["items={items}"],
};
