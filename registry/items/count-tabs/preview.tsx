"use client";

import { CountTabs } from "./count-tabs.tsx";
import { queues } from "./fixtures.ts";

export default function CountTabsPreview() {
  return (
    <div className="w-full max-w-[520px]">
      <CountTabs items={queues} ariaLabel="Review queues" />
    </div>
  );
}
