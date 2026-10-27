"use client";
import { useState } from "react";
import type { PlaygroundSpec, PlaygroundValues } from "../../types.ts";
import { DissolveInput } from "./dissolve-input";
function Example({ values }: { values: PlaygroundValues }) {
  const [value, setValue] = useState("");
  return <DissolveInput value={value} onChange={setValue} placeholder={String(values.placeholder)} type={String(values.type)} disabled={Boolean(values.disabled)} mask={Boolean(values.mask)} className="max-w-sm" />;
}
export const playground: PlaygroundSpec = {
  component: "DissolveInput",
  controls: [
    { type: "text", name: "placeholder", label: "Placeholder", default: "Type and press Enter…" },
    { type: "select", name: "type", label: "Input type", options: ["text", "email", "password"], default: "text" },
    { type: "boolean", name: "mask", label: "Mask particles", default: false },
    { type: "boolean", name: "disabled", label: "Disabled", default: false },
  ],
  render: (values) => <Example values={values} />,
  codeProps: ["value={value}", "onChange={setValue}"],
};
