"use client";
import { useState } from "react";
import { DropdownMenu } from "radix-ui";
export type SortChoice = { value: string; label: string };
export type SortByHeadingProps = {
  prefix?: string; options: readonly SortChoice[]; value?: string; defaultValue?: string;
  onValueChange?: (value: string) => void; direction?: "asc" | "desc";
  defaultDirection?: "asc" | "desc"; onDirectionChange?: (direction: "asc" | "desc") => void;
};
export function SortByHeading({ prefix = "Top landlords by", options, value, defaultValue, onValueChange, direction, defaultDirection = "desc", onDirectionChange }: SortByHeadingProps) {
  const [internal, setInternal] = useState(defaultValue ?? options[0]?.value ?? "");
  const [internalDirection, setInternalDirection] = useState(defaultDirection);
  const selected = value ?? internal;
  const dir = direction ?? internalDirection;
  const active = options.find(option => option.value === selected) ?? options[0];
  return <div className="flex w-full flex-wrap items-center gap-2 font-body text-ink">
    <h2 className="font-heading text-xl">{prefix}</h2>
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild disabled={!options.length}>
        <button type="button" aria-label={`Rank by ${active?.label ?? "a measure"}`} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-inset border border-rule px-2.5 font-heading text-xl leading-none text-lead hover:border-lead focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lead disabled:cursor-default disabled:opacity-50">
          {active?.label ?? "Choose a measure"}<span aria-hidden="true" className="text-xs">▾</span>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="start" sideOffset={4} collisionPadding={16} className="z-50 min-w-40 overflow-hidden rounded-panel border border-rule bg-popover py-1 font-body text-sm text-popover-foreground shadow-lg outline-none">
        <DropdownMenu.RadioGroup value={active?.value ?? ""} onValueChange={next => { setInternal(next); onValueChange?.(next); }}>
          {options.map(option => (
            <DropdownMenu.RadioItem key={option.value} value={option.value} className="flex min-h-11 cursor-pointer items-center justify-between gap-4 px-3 py-2 outline-none data-[highlighted]:bg-paper data-[state=checked]:text-lead">
              {option.label}
              <DropdownMenu.ItemIndicator aria-hidden="true" className="text-xs">✓</DropdownMenu.ItemIndicator>
            </DropdownMenu.RadioItem>
          ))}
        </DropdownMenu.RadioGroup>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
    <button type="button" onClick={() => { const next = dir === "desc" ? "asc" : "desc"; setInternalDirection(next); onDirectionChange?.(next); }} className="min-h-11 cursor-pointer rounded-inset border border-rule px-2.5 py-1.5 text-xs text-dim transition-colors hover:border-lead hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lead" title={dir === "desc" ? "Highest first" : "Lowest first"}>{dir === "desc" ? "Descending ↓" : "Ascending ↑"}</button>
  </div>;
}
