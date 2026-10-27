"use client";

import type { PlaygroundSpec } from "../../types.ts";
import { CtaButton, type CtaSize, type CtaTone } from "./cta-button.tsx";

export const playground: PlaygroundSpec = {
  component: "CtaButton",
  controls: [
    { type: "text", name: "label", label: "Label", default: "Get Started" },
    { type: "select", name: "tone", label: "Tone", options: ["glass", "sheet"], default: "glass" },
    { type: "select", name: "size", label: "Size", options: ["sm", "lg"], default: "lg" },
    { type: "boolean", name: "disabled", label: "Disabled", default: false },
  ],
  render: (values) => {
    const tone = values.tone as CtaTone;
    const button = (
      <CtaButton
        type="button"
        label={String(values.label)}
        tone={tone}
        size={values.size as CtaSize}
        disabled={Boolean(values.disabled)}
      />
    );
    // `sheet` is the twin for a solid ink surface (an open menu): its label is
    // on-solid, so on the tile's own surface it would all but vanish. It gets
    // the surface it was made for; `glass` sits on the tile as it is.
    return tone === "sheet" ? <div className="rounded-panel bg-ink p-8">{button}</div> : button;
  },
  codeProps: ['type="button"', "onClick={openApp}"],
};
