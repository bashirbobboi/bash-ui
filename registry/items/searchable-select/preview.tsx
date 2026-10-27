"use client";

import { useState } from "react";
import { SearchableSelect } from "./searchable-select";
import { groups } from "./fixtures";

export default function SearchableSelectPreview() {
  const [value, setValue] = useState("");
  return <SearchableSelect id="client-preview" value={value} onChange={setValue} groups={groups} placeholder="Choose a client" searchPlaceholder="Search clients…" className="max-w-sm" />;
}
