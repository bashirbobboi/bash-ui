"use client";
import { ExpandingMenu } from "./expanding-menu";
import { items } from "./fixtures";

export default function Preview() {
  return (
    <div className="w-[300px] max-w-full" style={{ height: 56 + items.length * 46 + 84 }}>
      <ExpandingMenu items={items} onNavigate={(_, event) => event.preventDefault()} footer={<button type="button" className="text-menu-dim">Sign out</button>} />
    </div>
  );
}
