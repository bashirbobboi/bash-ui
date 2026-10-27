"use client";

import type { PlaygroundSpec } from "../../types.ts";
import { TickableTodoList } from "./fixtures.tsx";

export const playground: PlaygroundSpec = {
  component: "TodoList",
  controls: [
    { type: "text", name: "title", label: "Title", default: "Getting started" },
    { type: "select", name: "tone", label: "Tone", options: ["brand", "lead", "go"], default: "brand" },
    { type: "select", name: "fold", label: "Fold", options: ["never", "mobile", "always"], default: "mobile" },
    { type: "boolean", name: "collapsed", label: "Collapsed", default: false },
  ],
  render: (values) => (
    <div className="w-full max-w-[360px]">
      <TickableTodoList
        title={String(values.title)}
        tone={values.tone as "brand" | "lead" | "go"}
        fold={values.fold as "never" | "mobile" | "always"}
        collapsed={Boolean(values.collapsed)}
      />
    </div>
  ),
  codeProps: ["items={steps}", "onToggle={markDone}"],
};
