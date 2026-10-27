"use client";

import type { ReactNode } from "react";
import { Popover } from "radix-ui";

export function CurrentSiteNotice({ children }: { children: ReactNode }) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button type="button" className="inline-flex min-h-11 items-center rounded-lg px-1 text-left transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lead">
          {children}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content sideOffset={8} collisionPadding={16} className="z-50 max-w-[calc(100vw-2rem)] rounded-xl border border-rule bg-popover p-4 text-[13px] leading-5 text-popover-foreground shadow-lg">
          <p>You’re already on the bash-ui website.</p>
          <Popover.Close className="mt-2 min-h-11 rounded-full bg-paper px-3 font-medium text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lead">Got it</Popover.Close>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
