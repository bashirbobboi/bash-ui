"use client";

import { ScrambleText } from "./scramble-text.tsx";

export default function ScrambleTextPreview() {
  return <ScrambleText text="Steeze" className="font-heading text-[clamp(28px,8vw,63px)] font-light text-ink [@media(max-width:768px)]:text-[clamp(38px,14vw,56px)]" />;
}
