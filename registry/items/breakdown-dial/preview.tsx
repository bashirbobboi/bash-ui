"use client";

import { PRIORITY_SEGMENTS } from "./fixtures.ts";
import { BreakdownDial } from "./breakdown-dial.tsx";

export default function BreakdownDialPreview() {
  return (
    <div className="w-full max-w-[360px]">
      <BreakdownDial segments={PRIORITY_SEGMENTS} />
    </div>
  );
}
