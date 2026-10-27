"use client";

import { useSyncExternalStore } from "react";
import { Pipette } from "lucide-react";
import { Popover } from "radix-ui";
import { HexColorPicker } from "react-colorful";
import { contrastRatio, textContrastResult } from "@/lib/contrast";
import type { KeyColour } from "@/lib/mix";
import { cn } from "@/lib/utils";
import { THEMES } from "@/themes";
import type { TokenName } from "@/themes/contract";
import type { Theme } from "@/themes/types";
import { HexField, type Mode } from "./mix-controls";

/** What each key colour is read against, for the contrast line. */
export const AGAINST: Partial<Record<KeyColour, { fg: TokenName; bg: TokenName; on: string }>> = {
  ink: { fg: "ink", bg: "card", on: "on the card" },
  dim: { fg: "dim", bg: "card", on: "on the card" },
  lead: { fg: "lead", bg: "card", on: "on the card" },
  paper: { fg: "foreground", bg: "paper", on: "for text on the inset" },
  go: { fg: "go", bg: "go-wash", on: "on its fill" },
  hold: { fg: "hold", bg: "hold-wash", on: "on its fill" },
  stop: { fg: "stop", bg: "stop-wash", on: "on its fill" },
};

/** Surfaces have nothing on them to measure; the panel shows primary text on them instead. */
const SURFACE_TEXT: Partial<Record<KeyColour, { fg: TokenName; bg: TokenName; on: string }>> = {
  ground: { fg: "ink", bg: "ground", on: "Primary text on it" },
  card: { fg: "ink", bg: "card", on: "Primary text on it" },
};

type EyeDropperResult = { sRGBHex: string };
type EyeDropperCtor = new () => { open: () => Promise<EyeDropperResult> };

const subscribeNever = () => () => {};

/**
 * A colour swatch that opens the playground's own picker: the same colour in
 * each design system (one tap borrows it), a saturation and hue picker, the
 * hex, an eyedropper where the browser has one, and the colour's contrast as
 * it changes. Everything applies as it moves, so the preview follows the drag.
 */
export function Swatch({
  label,
  token,
  mode,
  theme,
  changed,
  onChange,
}: {
  label: string;
  token: KeyColour;
  mode: Mode;
  /** The mix as it stands, for the current value and the contrast line. */
  theme: Theme;
  changed: boolean;
  onChange: (hex: string) => void;
}) {
  const value = theme[mode][token];
  // Only Chromium has an EyeDropper; elsewhere the button is left out.
  const dropper = useSyncExternalStore(
    subscribeNever,
    () => ("EyeDropper" in window ? (window as unknown as { EyeDropper: EyeDropperCtor }).EyeDropper : null),
    () => null,
  );
  const pair = AGAINST[token] ?? SURFACE_TEXT[token];
  const ratio = pair ? contrastRatio(theme[mode][pair.fg], theme[mode][pair.bg]) : null;
  const shown = ratio === null ? "" : (Math.floor(ratio * 10) / 10).toFixed(1);
  const sentence = pair ? (AGAINST[token] ? `${shown}:1 ${pair.on}` : `${pair.on}: ${shown}:1`) : "";

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={`${label}: ${value}`}
          title={value}
          style={{ background: value }}
          className="relative block size-8 shrink-0 cursor-pointer rounded-lg ring-1 ring-rule ring-inset focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {changed ? <span aria-hidden="true" className="absolute -top-1 -right-1 size-2 rounded-full bg-lead ring-2 ring-(--site-stage)" /> : null}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="right"
          align="start"
          sideOffset={10}
          collisionPadding={16}
          aria-label={label}
          className="z-50 w-64 space-y-3 rounded-xl border border-rule bg-popover p-3 text-[13px] text-popover-foreground shadow-lg data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 motion-reduce:animate-none"
        >
          <div className="space-y-1.5">
            <span className="block text-[11px] text-faint">From the systems</span>
            <div className="flex gap-1.5">
              {THEMES.map((system) => {
                const hex = system[mode][token];
                const on = hex.toLowerCase() === value.toLowerCase();
                return (
                  <button
                    key={system.slug}
                    type="button"
                    aria-pressed={on}
                    aria-label={`${system.name}: ${hex}`}
                    title={`${system.name} · ${hex}`}
                    onClick={() => onChange(hex.toLowerCase())}
                    style={{ background: hex }}
                    className={cn(
                      "size-7 cursor-pointer rounded-md ring-1 ring-rule ring-inset focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                      on && "outline-2 outline-offset-2 outline-ink",
                    )}
                  />
                );
              })}
            </div>
          </div>

          {/* react-colorful's own styles set the layout; these only size and round it to the site. */}
          <div className="[&_.react-colorful]:h-40 [&_.react-colorful]:w-full [&_.react-colorful__hue]:mt-2 [&_.react-colorful__hue]:h-3 [&_.react-colorful__hue]:rounded-full [&_.react-colorful__hue-pointer]:size-4 [&_.react-colorful__saturation]:rounded-lg [&_.react-colorful__saturation]:border-b-0 [&_.react-colorful__saturation-pointer]:size-4">
            <HexColorPicker color={value} onChange={(hex) => onChange(hex.toLowerCase())} />
          </div>

          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <HexField label={`${label} hex`} value={value} onChange={onChange} />
            </div>
            {dropper ? (
              <button
                type="button"
                aria-label="Pick a colour from the screen"
                title="Pick from the screen"
                onClick={() => {
                  new dropper()
                    .open()
                    .then((result) => onChange(result.sRGBHex.toLowerCase()))
                    .catch(() => {});
                }}
                className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg text-dim transition-colors hover:bg-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-ring"
              >
                <Pipette aria-hidden="true" className="size-4" />
              </button>
            ) : null}
          </div>

          {ratio !== null ? (
            <p className={cn("text-[12px] leading-5", ratio >= 4.5 ? "text-dim" : "text-stop")}>
              {sentence} · {textContrastResult(ratio)}
            </p>
          ) : null}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
