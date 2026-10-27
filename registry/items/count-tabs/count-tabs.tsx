"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * A row of underlined tabs, each carrying a count chip, for switching between
 * queues or lists that live on one page. The open tab turns lead with a 2px
 * underline sitting on the row's rule; its chip takes the lead wash.
 *
 * Keyboard follows the WAI-ARIA tabs pattern with automatic activation: one
 * tab stop for the row, ←/→ move and open (wrapping), Home/End jump to the
 * ends. On a phone the row scrolls sideways as a strip rather than wrapping or
 * widening the page.
 *
 * Pair each tab with a panel: spread `countTabPanelProps(idPrefix, id, value)`
 * onto it so `aria-controls`/`aria-labelledby` line up.
 */

export type CountTabItem = {
  id: string;
  label: React.ReactNode;
  /** The chip's number. Zero still shows; omit (or null) for no chip. */
  count?: number | null;
};

export interface CountTabsProps {
  items: readonly CountTabItem[];
  /** Controlled open tab. */
  value?: string;
  /** Starting tab when uncontrolled. Defaults to the first item. */
  defaultValue?: string;
  /** Called with the id of the tab opened, by click or keyboard. */
  onValueChange?: (id: string) => void;
  /** Accessible name of the tablist. */
  ariaLabel?: string;
  /**
   * Prefix for the tab and panel element ids (`<prefix>-tab-<id>`,
   * `<prefix>-panel-<id>`). Pass one when you render panels, so they can be
   * linked with `countTabPanelProps`.
   */
  idPrefix?: string;
  className?: string;
}

const tabId = (prefix: string, id: string) => `${prefix}-tab-${id}`;
const panelId = (prefix: string, id: string) => `${prefix}-panel-${id}`;

/** Props for the panel behind tab `id`: role, ids, and `hidden` when closed. */
export function countTabPanelProps(idPrefix: string, id: string, value: string | undefined) {
  return {
    id: panelId(idPrefix, id),
    role: "tabpanel" as const,
    "aria-labelledby": tabId(idPrefix, id),
    hidden: value !== id,
  };
}

export function CountTabs({
  items,
  value,
  defaultValue,
  onValueChange,
  ariaLabel,
  idPrefix,
  className,
}: CountTabsProps) {
  const reactId = React.useId();
  const prefix = idPrefix ?? `count-tabs-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [ownValue, setOwnValue] = React.useState(defaultValue ?? items[0]?.id);
  const current = value !== undefined ? value : ownValue;
  const tabRefs = React.useRef(new Map<string, HTMLButtonElement>());

  const open = (id: string) => {
    if (value === undefined) setOwnValue(id);
    onValueChange?.(id);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const order = items.map((item) => item.id);
    const at = order.indexOf(current ?? "");
    let next: string | undefined;
    if (event.key === "ArrowRight") next = order[(at + 1) % order.length];
    if (event.key === "ArrowLeft") next = order[(at - 1 + order.length) % order.length];
    if (event.key === "Home") next = order[0];
    if (event.key === "End") next = order[order.length - 1];
    if (next === undefined) return;

    event.preventDefault();
    open(next);
    tabRefs.current.get(next)?.focus();
  };

  // If the controlled value is not a tab, the first tab keeps the tab stop.
  const focusable = items.some((item) => item.id === current) ? current : items[0]?.id;

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        // Scrolls sideways, at any width the row does not fit, and never up and
        // down. The rule is an inset line inside the box rather than a border,
        // so the open tab's underline can sit exactly on it without poking out
        // of the scroll area (which is what made it scroll vertically).
        "flex items-end gap-6 overflow-x-auto overflow-y-hidden font-body shadow-[inset_0_-1px_0_var(--rule)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {items.map((item) => {
        const active = item.id === current;
        const count = item.count ?? null;
        return (
          <button
            key={item.id}
            ref={(node) => {
              if (node) tabRefs.current.set(item.id, node);
              else tabRefs.current.delete(item.id);
            }}
            type="button"
            role="tab"
            id={tabId(prefix, item.id)}
            aria-controls={panelId(prefix, item.id)}
            aria-selected={active}
            tabIndex={item.id === focusable ? 0 : -1}
            onClick={() => open(item.id)}
            onKeyDown={handleKeyDown}
            className={cn(
              "relative inline-flex shrink-0 cursor-pointer items-center gap-2 pb-3 text-sm font-semibold whitespace-nowrap transition-colors pointer-coarse:min-h-11 focus-visible:ring-2 focus-visible:ring-lead/30 focus-visible:outline-none",
              active
                ? "text-lead after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-lead"
                : "text-dim hover:text-ink",
            )}
          >
            {item.label}
            {count !== null && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] tabular-nums",
                  active ? "bg-lead-wash text-lead" : "bg-paper-sunk text-dim",
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
