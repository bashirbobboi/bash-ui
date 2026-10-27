"use client";

import { useState, type ReactNode } from "react";
import { Ghost } from "./ghost";

/** The ghost stands in for the reader's agent: it gets to work while the note has their attention. */
export function AgentNote({ children }: { children: ReactNode }) {
  const [busy, setBusy] = useState(false);
  return (
    <div
      onPointerEnter={() => setBusy(true)}
      onPointerLeave={() => setBusy(false)}
      onFocus={() => setBusy(true)}
      onBlur={() => setBusy(false)}
      className="flex items-center gap-4 rounded-xl bg-card px-4 py-3.5"
    >
      <Ghost size={48} state={busy ? "working" : "default"} className="shrink-0" />
      <p className="text-[14px] leading-[22px] text-foreground">{children}</p>
    </div>
  );
}
