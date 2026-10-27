"use client";

import type { PlaygroundSpec } from "../../types.ts";
import { faqs } from "./fixtures.ts";
import { FaqAccordion } from "./faq-accordion.tsx";

export const playground: PlaygroundSpec = {
  component: "FaqAccordion",
  controls: [
    { type: "select", name: "type", label: "Type", options: ["single", "multiple"], default: "single" },
    { type: "boolean", name: "collapsible", label: "Collapsible", default: true },
    {
      type: "select",
      name: "defaultValue",
      label: "Open at first",
      options: [{ value: "", label: "None" }, ...faqs.map((faq) => faq.id)],
      default: "what",
    },
    { type: "number", name: "iconSize", label: "Icon size", min: 16, max: 36, step: 2, default: 24 },
    { type: "boolean", name: "disabled", label: "Disabled", default: false },
  ],
  render: (values) => {
    const open = String(values.defaultValue);
    const shared = { items: faqs, iconSize: Number(values.iconSize), disabled: Boolean(values.disabled) };
    // Keyed on the starting state so changing it in the panel remounts with that item open.
    const key = `${values.type}-${open}-${values.collapsible}`;
    return (
      <div className="w-full max-w-[420px]">
        {values.type === "multiple" ? (
          <FaqAccordion key={key} {...shared} type="multiple" defaultValue={open ? [open] : []} />
        ) : (
          <FaqAccordion key={key} {...shared} type="single" collapsible={Boolean(values.collapsible)} defaultValue={open} />
        )}
      </div>
    );
  },
  codeProps: ["items={faqs}", "onValueChange={setOpen}"],
};
