"use client";

import { useState } from "react";

import { TodoList, type TodoItem, type TodoListProps } from "./todo-list.tsx";

/** Fake steps and a stateful stand-in for the caller, for the preview and the playground. Not shipped. */

const STEPS: TodoItem[] = [
  { id: "brief", title: "Read the client brief", done: true },
  { id: "accounts", title: "Pull the filed accounts", done: true },
  { id: "intro", title: "Draft the introduction email", done: false },
  { id: "call", title: "Book the scoping call", done: false },
];

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Ticks save after a short pause, the way a server call would. */
export function TickableTodoList(props: Omit<TodoListProps, "items" | "onToggle">) {
  const [items, setItems] = useState(STEPS);
  return (
    <TodoList
      {...props}
      items={items}
      onToggle={async (id, done) => {
        await wait(350);
        setItems((current) => current.map((item) => (item.id === id ? { ...item, done } : item)));
      }}
    />
  );
}
