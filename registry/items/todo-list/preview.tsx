"use client";

import { TickableTodoList } from "./fixtures.tsx";

export default function TodoListPreview() {
  return (
    <div className="w-full max-w-[360px]">
      <TickableTodoList title="Before the first call" fold="never" />
    </div>
  );
}
