"use client";

import { useState } from "react";
import { Tooltip } from "radix-ui";
import { getTheme } from "@/themes";
import { TOKENS } from "@/themes/contract";
import type { Theme } from "@/themes/types";

const SWATCHES = ["ground", "card", "paper", "ink", "dim", "lead", "go", "hold", "stop"] as const;

function ColourValues({ hex }: { hex: string }) {
  const rgb = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
  return (
    <>
      <span className="block">{hex.toUpperCase()}</span>
      <span className="block">rgb({rgb.join(", ")})</span>
    </>
  );
}

/**
 * Shared palette preview for design-system cards and overview states. A system
 * that is not in THEMES (the playground's mix) passes its own `values`.
 */
export function PaletteStrip({ theme, values }: { theme: string; values?: Pick<Theme, "light" | "dark"> }) {
  const [open, setOpen] = useState<string | null>(null);
  const system = values ?? getTheme(theme);
  if (!system) return null;

  return (
    <Tooltip.Provider delayDuration={150}>
      <div data-theme={theme} role="group" aria-label="System palette" className="relative z-10 flex h-12 overflow-hidden rounded-xl after:pointer-events-none after:absolute after:inset-0 after:rounded-xl after:ring-1 after:ring-rule after:ring-inset">
        {SWATCHES.map((token) => (
          <Tooltip.Root key={token} open={open === token} onOpenChange={(next) => setOpen(next ? token : null)}>
            <Tooltip.Trigger
              type="button"
              aria-label={`${token} colour`}
              className="min-w-0 flex-1 cursor-help focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-ring"
              style={{ background: `var(--${token})` }}
              onClick={(event) => {
                // Also reveal values on touch; prevent Radix's click-to-close.
                event.preventDefault();
                setOpen(token);
              }}
            />
            <Tooltip.Portal>
              <Tooltip.Content
                side="top"
                sideOffset={8}
                collisionPadding={12}
                className="z-50 max-w-64 rounded-inset border border-rule bg-popover px-3 py-2 text-left font-body text-[12px] leading-5 text-popover-foreground shadow-lg"
              >
                <span className="block font-semibold">{token}</span>
                <span className="block text-dim">{TOKENS.find((spec) => spec.name === token)?.role}</span>
                {/* CSS follows the mode immediately, including before hydration. */}
                <span className="mt-1 block font-mono text-[11px] dark:hidden">
                  <ColourValues hex={system.light[token]} />
                </span>
                <span className="mt-1 hidden font-mono text-[11px] dark:block">
                  <ColourValues hex={system.dark[token]} />
                </span>
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        ))}
      </div>
    </Tooltip.Provider>
  );
}
