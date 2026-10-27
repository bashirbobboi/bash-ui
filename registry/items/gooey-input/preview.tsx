"use client";

import { GooeyInput } from "./gooey-input.tsx";
import { subscribe } from "./fixtures.ts";

export default function GooeyInputPreview() {
  return (
    // Fluid, so the field and the droplet's travel fit the tile at any width.
    <div className="w-full max-w-[360px]">
      <GooeyInput
        type="email"
        autoComplete="email"
        placeholder="you@example.org"
        ariaLabel="Email address"
        buttonIcon="send"
        submitLabel="Subscribe"
        clearOnSuccess
        successMessage="You're on the list"
        fluid
        onSubmit={subscribe}
      />
    </div>
  );
}
