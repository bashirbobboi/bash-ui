"use client";

import type { PlaygroundSpec } from "../../types.ts";
import { ScrambleText } from "./scramble-text.tsx";

export const playground: PlaygroundSpec = {
  component: "ScrambleText",
  controls: [
    { type: "text", name: "text", label: "Text", default: "Steeze" },
    { type: "text", name: "decoy", label: "Decoy", default: "xoxoxo" },
    { type: "number", name: "frameDuration", label: "Frame (ms)", min: 40, max: 300, step: 10, default: 100 },
    { type: "boolean", name: "play", label: "Play", default: true },
  ],
  render: (values) => (
    <ScrambleText
      text={String(values.text)}
      decoy={String(values.decoy)}
      frameDuration={Number(values.frameDuration)}
      play={Boolean(values.play)}
      className="font-heading text-[clamp(28px,8vw,63px)] font-light text-ink [@media(max-width:768px)]:text-[clamp(38px,14vw,56px)]"
    />
  ),
  codeProps: ['className="font-heading text-[clamp(28px,8vw,63px)] font-light [@media(max-width:768px)]:text-[clamp(38px,14vw,56px)]"', "onComplete={showHero}"],
};
