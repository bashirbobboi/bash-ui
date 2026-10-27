"use client";

import type { PlaygroundSpec } from "../../types.ts";
import { CountTabs } from "./count-tabs.tsx";
import { queues } from "./fixtures.ts";

export const playground: PlaygroundSpec = {
  component: "CountTabs",
  controls: [
    {
      type: "select",
      name: "defaultValue",
      label: "Open tab",
      options: queues.map((queue) => ({ value: queue.id, label: String(queue.label) })),
      default: "held",
    },
    { type: "text", name: "ariaLabel", label: "Accessible name", default: "" },
    { type: "text", name: "idPrefix", label: "Id prefix (to link panels)", default: "" },
  ],
  render: (values) => (
    <div className="w-full max-w-[520px]">
      {/* Keyed on the starting tab: defaultValue only counts on mount. */}
      <CountTabs
        key={String(values.defaultValue)}
        items={queues}
        defaultValue={String(values.defaultValue)}
        ariaLabel={values.ariaLabel ? String(values.ariaLabel) : undefined}
        idPrefix={values.idPrefix ? String(values.idPrefix) : undefined}
      />
    </div>
  ),
  codeProps: ["items={queues}", "onValueChange={setQueue}"],
};
