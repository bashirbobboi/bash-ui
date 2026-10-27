"use client";

import { useState } from "react";
import type { PlaygroundSpec, PlaygroundValues } from "../../types.ts";
import { SearchableSelect } from "./searchable-select";
import { groups } from "./fixtures";

function Example({ values }: { values: PlaygroundValues }) {
  const [value, setValue] = useState("");
  return <SearchableSelect
    id="client-playground" value={value} onChange={setValue} groups={groups}
    placeholder={String(values.placeholder)}
    searchPlaceholder={String(values.searchPlaceholder)}
    disabled={Boolean(values.disabled)}
    allowCustom={Boolean(values.allowCustom)}
    className="max-w-sm"
  />;
}

export const playground: PlaygroundSpec = {
  component: "SearchableSelect",
  controls: [
    { type: "text", name: "placeholder", label: "Placeholder", default: "Choose a client" },
    { type: "text", name: "searchPlaceholder", label: "Search prompt", default: "Search clients…" },
    { type: "boolean", name: "disabled", label: "Disabled", default: false },
    { type: "boolean", name: "allowCustom", label: "Allow a custom choice", default: false },
  ],
  render: (values) => <Example values={values} />,
  codeProps: ['id="client"', "value={value}", "onChange={setValue}", "groups={groups}"],
};
