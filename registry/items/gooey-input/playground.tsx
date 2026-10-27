"use client";

import type { PlaygroundSpec } from "../../types.ts";
import { GooeyInput, type GooeyInputIcon } from "./gooey-input.tsx";
import { subscribe } from "./fixtures.ts";

export const playground: PlaygroundSpec = {
  component: "GooeyInput",
  controls: [
    { type: "text", name: "placeholder", label: "Placeholder", default: "Type here…" },
    {
      type: "select",
      name: "buttonIcon",
      label: "Droplet icon",
      options: ["arrow", "send", "sparkles", "check", "x", "plus"],
      default: "arrow",
    },
    { type: "select", name: "size", label: "Size", options: ["sm", "md", "lg"], default: "md" },
    { type: "select", name: "feel", label: "Feel", options: ["calm", "bouncy"], default: "calm" },
    { type: "select", name: "loadingIcon", label: "Busy face", options: ["spinner", "square"], default: "spinner" },
    { type: "boolean", name: "pending", label: "Pending", default: false },
  ],
  render: (values) => (
    <div className="w-full max-w-[360px]">
      <GooeyInput
        placeholder={String(values.placeholder)}
        buttonIcon={values.buttonIcon as GooeyInputIcon}
        size={values.size as "sm" | "md" | "lg"}
        feel={values.feel as "calm" | "bouncy"}
        loadingIcon={values.loadingIcon as "spinner" | "square"}
        pending={Boolean(values.pending)}
        fluid
        onSubmit={subscribe}
      />
    </div>
  ),
  codeProps: ["fluid", "onSubmit={subscribe}"],
};
