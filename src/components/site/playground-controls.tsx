"use client";

import { useRef, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { PlaygroundControl, PlaygroundValues } from "@/registry/types";

/** A labelled group in the controls panel: small grey label over its control. */
export function ControlGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-[12px] leading-4 text-dim">{label}</div>
      {children}
    </div>
  );
}

/** Pills where one is picked. The picked one is lit, the rest are quiet. */
export function PillChoice({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "h-8 rounded-full px-3 text-[13px] font-medium whitespace-nowrap transition-[background-color,color,box-shadow] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dim",
              selected ? "site-raised text-ink" : "bg-[var(--site-chip)] text-dim hover:bg-[var(--site-chip-hover)] hover:text-ink",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * A number as a bar you drag: the lit part is the value, its label rides on
 * it and the number sits at the right. Arrow keys step it; Home/End jump.
 */
export function ScrubSlider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const ratio = max === min ? 0 : (value - min) / (max - min);
  const decimals = (String(step).split(".")[1] ?? "").length;

  function clamp(next: number) {
    const snapped = Math.round((next - min) / step) * step + min;
    return Number(Math.min(max, Math.max(min, snapped)).toFixed(decimals));
  }

  function fromPointer(event: PointerEvent<HTMLDivElement>) {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const at = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    onChange(clamp(min + at * (max - min)));
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const big = (max - min) / 10;
    const moves: Record<string, number> = {
      ArrowRight: value + step,
      ArrowUp: value + step,
      ArrowLeft: value - step,
      ArrowDown: value - step,
      PageUp: value + big,
      PageDown: value - big,
      Home: min,
      End: max,
    };
    if (event.key in moves) {
      event.preventDefault();
      onChange(clamp(moves[event.key]));
    }
  }

  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      onKeyDown={onKeyDown}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        fromPointer(event);
      }}
      onPointerMove={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) fromPointer(event);
      }}
      className="relative flex h-10 cursor-ew-resize touch-none items-center overflow-hidden rounded-xl bg-[var(--site-chip)] select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dim"
    >
      <div
        className="site-raised absolute inset-y-0 left-0 rounded-xl"
        style={{ width: `max(${ratio * 100}%, 6.5rem)` }}
        aria-hidden="true"
      />
      <span className="relative pl-3 text-[13px] font-medium text-ink">{label}</span>
      <span className="relative ml-auto pr-3 font-mono text-[12.5px] text-ink tabular-nums">{value}</span>
    </div>
  );
}

/** Renders whichever control a playground spec names. */
export function Control({
  control,
  values,
  onChange,
}: {
  control: PlaygroundControl;
  values: PlaygroundValues;
  onChange: (name: string, value: string | number | boolean) => void;
}) {
  const label = control.label ?? control.name;
  const value = values[control.name];

  switch (control.type) {
    case "select":
      return (
        <ControlGroup label={label}>
          <PillChoice
            label={label}
            value={String(value)}
            onChange={(next) => onChange(control.name, next)}
            options={control.options.map((option) =>
              typeof option === "string" ? { value: option, label: option } : option,
            )}
          />
        </ControlGroup>
      );
    case "boolean":
      return (
        <ControlGroup label={label}>
          <PillChoice
            label={label}
            value={value ? "on" : "off"}
            onChange={(next) => onChange(control.name, next === "on")}
            options={[
              { value: "off", label: "Off" },
              { value: "on", label: "On" },
            ]}
          />
        </ControlGroup>
      );
    case "number":
      return (
        <ScrubSlider
          label={label}
          value={Number(value)}
          min={control.min}
          max={control.max}
          step={control.step}
          onChange={(next) => onChange(control.name, next)}
        />
      );
    case "text":
      return (
        <ControlGroup label={label}>
          <input
            type="text"
            value={String(value)}
            onChange={(event) => onChange(control.name, event.target.value)}
            aria-label={label}
            className="h-10 w-full rounded-xl bg-[var(--site-chip)] px-3 text-[13px] text-ink outline-none placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dim"
          />
        </ControlGroup>
      );
  }
}
