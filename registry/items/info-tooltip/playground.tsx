"use client";

import type { PlaygroundSpec } from "../../types.ts";
import { InfoTooltip } from "./info-tooltip.tsx";

type Side = "top" | "bottom" | "left" | "right";
type Align = "start" | "center" | "end";

// Fixed rather than a control: a control left at its starting value drops out
// of the code panel, and the body is the one thing every use needs.
const CONTENT = "Total income from the most recent accounts filed with the regulator.";

export const playground: PlaygroundSpec = {
  component: "InfoTooltip",
  controls: [
    { type: "text", name: "title", label: "Title", default: "" },
    { type: "text", name: "footer", label: "Footer", default: "" },
    { type: "select", name: "side", label: "Opens on", options: ["top", "right", "bottom", "left"], default: "top" },
    { type: "select", name: "align", label: "Align", options: ["start", "center", "end"], default: "center" },
    { type: "number", name: "sideOffset", label: "Gap", min: 0, max: 20, step: 1, default: 6 },
    { type: "boolean", name: "showArrow", label: "Arrow", default: false },
  ],
  render: (values) => (
    <InfoTooltip
      content={CONTENT}
      title={values.title ? String(values.title) : undefined}
      footer={values.footer ? String(values.footer) : undefined}
      side={values.side as Side}
      align={values.align as Align}
      sideOffset={Number(values.sideOffset)}
      showArrow={Boolean(values.showArrow)}
    />
  ),
  codeProps: [`content="${CONTENT}"`],
};
