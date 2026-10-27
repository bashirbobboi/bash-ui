"use client";

import { sections } from "./fixtures.ts";
import { GooeyTabs } from "./gooey-tabs.tsx";

export default function GooeyTabsPreview() {
  return (
    <div className="flex w-full max-w-[420px] justify-center">
      {/* 96px tabs keep four of them inside the tile; the strip scrolls if it ever has to. */}
      <GooeyTabs items={sections} tabWidth={88} ariaLabel="Sections of this client record" className="max-w-full min-w-0" />
    </div>
  );
}
