"use client";

import type { PlaygroundSpec } from "../../types.ts";
import { sections } from "./fixtures.ts";
import { GooeyTabs } from "./gooey-tabs.tsx";

export const playground: PlaygroundSpec = {
  component: "GooeyTabs",
  controls: [
    {
      type: "select",
      name: "defaultValue",
      label: "Open tab",
      options: sections.map((section) => section.id),
      default: "overview",
    },
    { type: "number", name: "tabWidth", label: "Tab width", min: 88, max: 140, step: 4, default: 112 },
    { type: "number", name: "gooBlur", label: "Goo blur", min: 0, max: 12, step: 1, default: 5 },
    { type: "number", name: "gooContrast", label: "Goo sharpness", min: 4, max: 40, step: 1, default: 18 },
  ],
  render: (values) => (
    <div className="flex w-full max-w-[560px] justify-center">
      {/* Keyed on the starting tab: defaultValue only counts on mount. */}
      <GooeyTabs
        key={String(values.defaultValue)}
        items={sections}
        defaultValue={String(values.defaultValue)}
        tabWidth={Number(values.tabWidth)}
        gooBlur={Number(values.gooBlur)}
        gooContrast={Number(values.gooContrast)}
        ariaLabel="Sections of this client record"
        className="max-w-full min-w-0"
      />
    </div>
  ),
  codeProps: ["items={sections}", "onValueChange={openSection}"],
};
