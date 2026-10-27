"use client";
import { useState } from "react";
import { DissolveInput } from "./dissolve-input";
export default function DissolveInputPreview() {
  const [value, setValue] = useState("");
  return <DissolveInput value={value} onChange={setValue} placeholder="Type and press Enter…" className="max-w-sm" />;
}
