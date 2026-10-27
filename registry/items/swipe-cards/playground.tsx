"use client";

import type { PlaygroundSpec } from "../../types.ts";
import { looks } from "./fixtures.ts";
import { SwipeCards } from "./swipe-cards.tsx";

export const playground: PlaygroundSpec = {
  component: "SwipeCards",
  controls: [
    { type: "select", name: "variant", label: "Variant", options: ["feed", "choice"], default: "feed" },
    { type: "text", name: "leftLabel", label: "Left label", default: "Skip" },
    { type: "text", name: "rightLabel", label: "Right label", default: "Like" },
    { type: "boolean", name: "loop", label: "Loop", default: true },
  ],
  render: (values) => (
    <SwipeCards
      items={looks}
      variant={values.variant as "feed" | "choice"}
      leftLabel={String(values.leftLabel) || undefined}
      rightLabel={String(values.rightLabel) || undefined}
      loop={Boolean(values.loop)}
      onAddToBag={() => {}}
      className="max-w-[320px]"
    />
  ),
  codeProps: ["items={looks}", "onSwipe={(item, direction) => record(item, direction)}", "onAddToBag={addToBag}"],
};
