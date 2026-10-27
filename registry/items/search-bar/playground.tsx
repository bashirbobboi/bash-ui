"use client";

import type { PlaygroundSpec } from "../../types.ts";
import { SearchBar } from "./search-bar.tsx";
import { categories } from "./fixtures.ts";

export const playground: PlaygroundSpec = {
  component: "SearchBar",
  controls: [
    { type: "text", name: "placeholder", label: "Prompt", default: "I want to learn about" },
    { type: "boolean", name: "pending", label: "Pending", default: false },
    { type: "boolean", name: "chipsBelow", label: "Chips under the pill", default: true },
    { type: "number", name: "minSpinMs", label: "Shortest spin (ms)", min: 0, max: 4000, step: 250, default: 1500 },
  ],
  render: (values) => (
    <div className="w-full max-w-[440px]">
      <SearchBar
        categories={categories}
        placeholder={String(values.placeholder)}
        pending={Boolean(values.pending)}
        chipsBelow={Boolean(values.chipsBelow)}
        minSpinMs={Number(values.minSpinMs)}
      />
    </div>
  ),
  codeProps: ["categories={categories}", "onSubmit={search}"],
};
