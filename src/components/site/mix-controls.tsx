"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { FONTS, RADIUS_MAX, fontWeights } from "@/lib/mix";
import { cn } from "@/lib/utils";
import { THEMES } from "@/themes";

/**
 * The playground's controls, shared by the guided steps and the editor so the
 * two never drift apart. Site chrome: they paint in the site's own theme, not
 * the mix's.
 */

export const MODES = ["light", "dark"] as const;
export type Mode = (typeof MODES)[number];

/** Where each face comes from, for the font menus: "Playfair Display · Curated". */
export function fontHome(family: string): string | undefined {
  return THEMES.find((theme) => Object.values(theme.fonts).some((font) => font?.family === family))?.name;
}

const WEIGHT_NAMES: Record<number, string> = { 300: "Light", 400: "Regular", 500: "Medium", 600: "Semibold", 700: "Bold" };

/** The heading weights a face has, named, for a picker. */
export function weightOptions(family: string) {
  return fontWeights(family).map((weight) => ({ value: String(weight), label: WEIGHT_NAMES[weight] ?? String(weight) }));
}

export const FONT_OPTIONS = FONTS.map((font) => {
  const home = fontHome(font.family);
  return { value: font.family, label: home ? `${font.family} · ${home}` : font.family };
});
export const SYSTEM_OPTIONS = THEMES.map((theme) => ({ value: theme.slug, label: theme.name }));

export const CONTROL =
  "site-chip h-9 w-full rounded-xl text-[13px] text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

/**
 * A progressive blur that fades content into the panel's colour: sharper
 * layers reach higher, the strongest stays at the bottom edge, so whatever
 * scrolls under it softens away with no hard line. Size and place it with
 * `className`; it never takes the pointer.
 */
export function ProgressiveBlur({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("pointer-events-none", className)}>
      {[1, 2, 4, 8].map((blur, layer) => {
        const mask = `linear-gradient(to top, black ${45 - layer * 12}%, transparent ${100 - layer * 18}%)`;
        return (
          <div
            key={blur}
            className="absolute inset-0"
            style={{ backdropFilter: `blur(${blur}px)`, WebkitBackdropFilter: `blur(${blur}px)`, maskImage: mask, WebkitMaskImage: mask }}
          />
        );
      })}
      <div className="absolute inset-0 bg-linear-to-t from-(--site-stage) from-25% to-transparent" />
    </div>
  );
}

export function Group({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[13px] leading-5 font-medium text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-[12px] text-dim">{label}</span>
      {children}
    </label>
  );
}

export function Select({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <span className="relative block">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(CONTROL, "appearance-none pr-8 pl-3 [color-scheme:light] dark:[color-scheme:dark]")}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-dim" />
    </span>
  );
}

/** A row of mutually exclusive choices: the buttons' shape, the preview's mode. */
export function Segmented<T extends string | boolean>({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("site-chip grid gap-1 rounded-xl p-1", className)}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "h-7 rounded-lg px-2 text-[12.5px] font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-ring",
            value === option.value ? "site-raised text-ink" : "text-dim hover:text-ink",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/**
 * A colour typed as hex. It keeps what is being typed to itself and only
 * reports a complete colour (`#1b2733`, or the short `#123`), so half a hex
 * never reaches the mix.
 */
export function HexField({ label, value, onChange }: { label: string; value: string; onChange: (hex: string) => void }) {
  const [draft, setDraft] = useState(value);
  const [shown, setShown] = useState(value);
  // A new colour from elsewhere (the picker, a reset) replaces the draft.
  if (shown !== value) {
    setShown(value);
    setDraft(value);
  }

  function commit(text: string) {
    const hex = text.trim().replace(/^#?/, "#").toLowerCase();
    const full = /^#[0-9a-f]{3}$/.test(hex) ? `#${[...hex.slice(1)].map((c) => c + c).join("")}` : hex;
    if (/^#[0-9a-f]{6}$/.test(full) && full !== value) onChange(full);
  }

  return (
    <input
      value={draft}
      onChange={(event) => {
        setDraft(event.target.value);
        if (/^#?[0-9a-f]{6}$/i.test(event.target.value.trim())) commit(event.target.value);
      }}
      onBlur={() => {
        commit(draft);
        setDraft(value);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") commit(draft);
      }}
      aria-label={label}
      spellCheck={false}
      autoComplete="off"
      maxLength={7}
      className={cn(CONTROL, "h-8 w-[84px] rounded-lg px-2 font-mono text-[12px] uppercase")}
    />
  );
}

export function Range({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="block space-y-1.5">
      <span className="flex justify-between text-[12px] text-dim">
        {label}
        <span className="text-ink tabular-nums">{value}px</span>
      </span>
      <input
        type="range"
        min={0}
        max={RADIUS_MAX}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-lead"
      />
    </label>
  );
}
