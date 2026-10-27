"use client";

import { useEffect, useId, useMemo, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronDown, RotateCcw } from "lucide-react";
import { motion, useReducedMotionConfig } from "motion/react";
import { CATEGORIES } from "@/lib/categories";
import { contrastRatio, textContrastResult, themeContrast } from "@/lib/contrast";
import { FONTS, KEY_COLOURS, PARTS_MAX, mixFrom, mixParams, mixThemeFile, nearestWeight, type KeyColour, type Mix } from "@/lib/mix";
import { SITE_URL } from "@/lib/site";
import { cn } from "@/lib/utils";
import { getTheme, THEMES } from "@/themes";
import type { Theme } from "@/themes/types";
import { MixCopyMenu } from "./copy-menu";
import { ItemIcon, SystemIcon } from "./item-icon";
import { STEPS, partsFor, type Part, type Step, type View } from "./mix-flow";
import { AGAINST, Swatch } from "./colour-picker";
import { CONTROL, Field, HexField, MODES, ProgressiveBlur, Range, Segmented, fontHome, weightOptions, type Mode } from "./mix-controls";
import { MixPreview, usePreviewMode } from "./mix-preview";

type SetMix = Dispatch<SetStateAction<Mix>>;

const MODE_OPTIONS = MODES.map((mode) => ({ value: mode, label: mode === "light" ? "Light" : "Dark" }));
const OPTION = "flex w-full min-w-0 items-center gap-3 rounded-xl p-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-ring";
const BACK =
  "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-dim transition-colors hover:site-chip hover:text-ink focus-visible:outline-2 focus-visible:outline-ring";
const NEXT =
  "inline-flex h-9 items-center gap-1.5 rounded-full bg-ink px-4 text-[13px] font-medium whitespace-nowrap text-on-solid transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

/**
 * The playground in steps: one question at a time on the left, the mix
 * building on the right. Every step can be revisited from the row along the
 * top, and the last one hands over to the editor for fine-tuning.
 *
 * The preview is the same at every step; only the question changes. The
 * colour step edits whichever mode the preview is showing.
 */
export function MixWizard({
  step,
  mix,
  setMix,
  theme,
  catalog,
  go,
  title,
}: {
  title?: ReactNode;
  step: Step;
  mix: Mix;
  setMix: SetMix;
  theme: Theme;
  catalog: Part[];
  go: (view: View) => void;
}) {
  const reduce = useReducedMotionConfig();
  const { mode, shown, setMode } = usePreviewMode();
  const index = STEPS.findIndex(({ id }) => id === step);
  const current = STEPS[index];
  const previous = STEPS[index - 1];
  const next = STEPS[index + 1];
  const update = (patch: Partial<Mix>) => setMix((now) => ({ ...now, ...patch }));
  const toStep = (id: Step) => go({ kind: "steps", step: id });
  const { parts, picked } = partsFor(catalog, mix.parts);

  const rootRef = useRef<HTMLDivElement>(null);
  const bandRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const settled = useRef(step);

  // A new step: focus its question (so a screen reader announces it) and,
  // when the top of the steps has scrolled away, bring it back.
  useEffect(() => {
    if (settled.current === step) return;
    settled.current = step;
    headingRef.current?.focus({ preventScroll: true });
    // At xl the preview scrolls in its own box: a new step starts it at the top.
    previewRef.current?.scrollTo({ top: 0 });
    const root = rootRef.current;
    const header = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    if (root && root.getBoundingClientRect().top < header) {
      root.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
    }
  }, [step, reduce]);

  // The pinned band's height, so the question panel can sit just under it
  // and size itself to what is left of the window.
  useEffect(() => {
    const band = bandRef.current;
    const root = rootRef.current;
    if (!band || !root) return;
    const observer = new ResizeObserver(() => root.style.setProperty("--mix-band", `${band.offsetHeight}px`));
    observer.observe(band);
    return () => observer.disconnect();
  }, []);

  // The first step has nowhere to go back to; Next stands alone.
  const backButton = previous ? (
    <button type="button" onClick={() => toStep(previous.id)} className={BACK}>
      <ArrowLeft aria-hidden="true" className="size-3.5" />
      Back
    </button>
  ) : (
    <span />
  );
  const nextButton = next ? (
    <button type="button" onClick={() => toStep(next.id)} className={NEXT}>
      {step === "components" && !mix.parts.length ? "Skip" : `Next: ${next.label}`}
      <ArrowRight aria-hidden="true" className="size-3.5" />
    </button>
  ) : (
    <button type="button" onClick={() => go({ kind: "editor" })} className={NEXT}>
      Open in the editor
      <ArrowRight aria-hidden="true" className="size-3.5" />
    </button>
  );

  const body = {
    start: <StartStep mix={mix} setMix={setMix} onNext={() => toStep("text")} />,
    text: <TextStep mix={mix} update={update} />,
    colour: <ColourStep mix={mix} setMix={setMix} theme={theme} mode={shown} setMode={setMode} />,
    shape: <ShapeStep mix={mix} update={update} />,
    components: <ComponentsStep mix={mix} update={update} catalog={catalog} />,
    review: <ReviewStep mix={mix} theme={theme} catalog={catalog} toStep={toStep} />,
  }[step];

  return (
    <div ref={rootRef} className="space-y-3 [--mix-band:0px] xl:-mt-4 xl:-mb-24">
      {/* At xl the playground fills the window and the page itself stops
          scrolling (the -mb cancels <main>'s bottom padding, the -mt halves
          its top padding): the title, the mode switch, the
          steps stay put, Back / Next close the question panel, and the question and the preview each
          scroll on their own, stopping at their own end. */}
      <div
        ref={bandRef}
        className="space-y-6 xl:sticky xl:top-(--header-h) xl:z-30 xl:-mx-1 xl:space-y-3 xl:bg-(--site-bg) xl:px-1 xl:pb-3"
      >
        <div className="xl:hidden">{title}</div>
        {/* At xl: the title alone, without the introduction. */}
        <h1 className="hidden text-[24px] leading-tight font-medium tracking-[-0.005em] text-ink xl:block">Playground</h1>
        <div className="flex items-center gap-3">
          <nav aria-label="Steps" className="min-w-0 flex-1">
            <ol className="-mx-4 flex gap-1 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
              {STEPS.map((item, at) => {
                const here = at === index;
                const done = at < index;
                return (
                  <li key={item.id} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => toStep(item.id)}
                      aria-current={here ? "step" : undefined}
                      className={cn(
                        "inline-flex h-9 items-center gap-2 rounded-full pr-3.5 pl-1.5 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring",
                        here ? "site-raised text-ink" : "text-dim hover:site-chip hover:text-ink",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-6 place-items-center rounded-full text-[11.5px] tabular-nums",
                          here ? "bg-ink text-on-solid" : done ? "site-chip text-ink" : "site-chip",
                        )}
                      >
                        {done ? <Check aria-hidden="true" className="size-3.5" strokeWidth={2.5} /> : at + 1}
                      </span>
                      {item.label}
                      {done ? <span className="sr-only">(visited)</span> : null}
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
          {/* At xl the preview's mode switch sits at the end of the steps. */}
          <div className="hidden shrink-0 xl:block">
            <Segmented label="Preview in" value={shown} options={MODE_OPTIONS} onChange={setMode} className="w-40" />
          </div>
        </div>
      </div>

      {/* Height: the window, less the header, the 1rem left of <main>'s top padding, the band, the 0.75rem gap above and a 1rem margin below. */}
      <div className="grid gap-3 xl:h-[calc(100dvh-var(--header-h)-var(--mix-band)-2.75rem)] xl:grid-cols-[340px_minmax(0,1fr)]">
        {/* Under xl the question, the preview and the step buttons stack, with the buttons pinned to the bottom. */}
        <div className="contents xl:flex xl:min-h-0 xl:flex-col">
          <section
            aria-labelledby={`${current.id}-question`}
            className="site-stage space-y-6 rounded-2xl p-4 [--mix-foot:5rem] sm:p-5 xl:relative xl:flex xl:min-h-0 xl:flex-1 xl:flex-col xl:overflow-hidden xl:pb-0"
          >
            <header className="space-y-1.5">
              <p className="text-[12px] text-faint">
                Step {index + 1} of {STEPS.length}
                {current.optional ? " · optional" : ""}
              </p>
              <h2
                ref={headingRef}
                id={`${current.id}-question`}
                tabIndex={-1}
                className="text-[19px] leading-tight font-medium tracking-[-0.01em] text-ink focus:outline-none"
              >
                {current.title}
              </h2>
              <p className="text-[13px] leading-5 text-dim">{current.hint}</p>
            </header>
            <motion.div
              key={step}
              initial={{ opacity: 0, y: reduce ? 0 : 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduce ? 0 : 0.18, ease: "easeOut" }}
              className={cn(
                "space-y-6 xl:-mx-1 xl:min-h-0 xl:flex-1 xl:px-1",
                // The start step scrolls only its list of systems; the others scroll whole.
                step === "start" ? "xl:flex xl:flex-col" : "xl:overflow-y-auto xl:overscroll-contain xl:pb-(--mix-foot)",
              )}
            >
              {body}
            </motion.div>
            {/* At xl Back / Next float over the foot of the panel, and what
                scrolls passes under them through a progressive blur. */}
            <ProgressiveBlur className="absolute inset-x-0 bottom-0 m-0! hidden h-28 xl:block" />
            <div className="absolute inset-x-0 bottom-0 m-0! hidden items-center justify-between gap-2 p-4 sm:p-5 xl:flex">
              {backButton}
              {nextButton}
            </div>
          </section>

          {/* Under xl Back / Next ride a bar pinned to the bottom of the window. */}
          <div className="site-stage sticky bottom-3 z-10 order-last flex items-center justify-between gap-2 rounded-2xl p-2 shadow-[0_8px_24px_rgba(0,0,0,0.16)] xl:hidden">
            {backButton}
            {nextButton}
          </div>
        </div>

        <div ref={previewRef} className="min-w-0 xl:min-h-0 xl:overflow-y-auto xl:overscroll-contain">
          <MixPreview
            theme={theme}
            parts={parts}
            picked={picked}
            mode={mode}
            shown={shown}
            setMode={setMode}
            onPick={step === "components" ? undefined : () => toStep("components")}
            pinHeader
            fitTo={previewRef}
          />
        </div>
      </div>
    </div>
  );
}

function StartStep({ mix, setMix, onNext }: { mix: Mix; setMix: SetMix; onNext: () => void }) {
  const labelId = useId();
  const untouched = JSON.stringify({ ...mixFrom(mix.base, mix.name), parts: mix.parts }) === JSON.stringify(mix);
  return (
    <>
      <Field label="Name">
        <input
          value={mix.name}
          onChange={(event) => setMix((now) => ({ ...now, name: event.target.value }))}
          onKeyDown={(event) => {
            if (event.key === "Enter") onNext();
          }}
          placeholder="Untitled"
          className={cn(CONTROL, "px-3 placeholder:text-faint")}
        />
      </Field>
      <div className="space-y-1.5 xl:flex xl:min-h-0 xl:flex-1 xl:flex-col">
        <span id={labelId} className="block text-[12px] text-dim">
          Start from
        </span>
        <div className="space-y-1.5 xl:-mx-1 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:overscroll-contain xl:px-1 xl:pb-(--mix-foot)">
        <div role="radiogroup" aria-labelledby={labelId} className="grid gap-0.5">
          {THEMES.map((theme) => {
            const checked = mix.base === theme.slug;
            return (
              <button
                key={theme.slug}
                type="button"
                role="radio"
                aria-checked={checked}
                onClick={() => setMix((now) => ({ ...mixFrom(theme.slug, now.name), parts: now.parts }))}
                className={cn(OPTION, checked ? "site-raised" : "hover:site-chip")}
              >
                <SystemIcon slug={theme.slug} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] leading-5 text-ink">{theme.name}</span>
                  <span className="block truncate text-[11.5px] leading-4 text-faint">
                    {theme.project} · {theme.fonts.heading.family}
                  </span>
                </span>
                {checked ? <Check aria-hidden="true" className="size-4 shrink-0 text-ink" /> : null}
              </button>
            );
          })}
        </div>
        {untouched ? null : <p className="text-[12px] leading-5 text-dim">Picking another resets your text, colours and corners.</p>}
        </div>
      </div>
    </>
  );
}

const ROLES = [
  { value: "heading", label: "Headings", noun: "headings" },
  { value: "body", label: "Body", noun: "body text" },
  { value: "mono", label: "Monospace", noun: "monospace" },
] as const;
type Role = (typeof ROLES)[number]["value"];

function TextStep({ mix, update }: { mix: Mix; update: (patch: Partial<Mix>) => void }) {
  const [role, setRole] = useState<Role>("heading");
  const noun = ROLES.find(({ value }) => value === role)?.noun;
  const used = new Set(THEMES.map((theme) => theme.fonts[role].family));
  const groups = [
    { label: `Used for ${noun} in a system`, fonts: FONTS.filter((font) => used.has(font.family)) },
    { label: "Other faces", fonts: FONTS.filter((font) => !used.has(font.family)) },
  ];

  return (
    <>
      <div className="space-y-1.5">
        <span className="block text-[12px] text-dim">Pairings</span>
        <div className="flex flex-wrap gap-1.5">
          {THEMES.map((theme) => {
            const { heading, body, mono } = theme.fonts;
            const on = heading.family === mix.heading && body.family === mix.body && mono.family === mix.mono;
            return (
              <button
                key={theme.slug}
                type="button"
                aria-pressed={on}
                title={`${heading.family}, ${body.family}, ${mono.family}`}
                onClick={() => update({ heading: heading.family, headingWeight: theme.scene.headingWeight ?? 600, body: body.family, mono: mono.family })}
                style={{ fontFamily: heading.css }}
                className={cn(
                  "h-8 rounded-full px-3 text-[13.5px] transition-colors focus-visible:outline-2 focus-visible:outline-ring",
                  on ? "site-raised text-ink" : "site-chip text-dim hover:text-ink",
                )}
              >
                {theme.name}
              </button>
            );
          })}
        </div>
      </div>
      <div className="space-y-3">
        <Segmented label="Text role" value={role} options={ROLES} onChange={setRole} />
        {role === "heading" ? <HeadingWeight mix={mix} update={update} /> : null}
        {groups.map((group) =>
          group.fonts.length ? (
            <div key={group.label} className="space-y-1">
              <span className="block px-1 text-[11px] text-faint">{group.label}</span>
              <div role="radiogroup" aria-label={`${ROLES.find(({ value }) => value === role)?.label}: ${group.label.toLowerCase()}`} className="grid gap-0.5">
                {group.fonts.map((font) => {
                  const checked = mix[role] === font.family;
                  return (
                    <button
                      key={font.family}
                      type="button"
                      role="radio"
                      aria-checked={checked}
                      onClick={() => update({ [role]: font.family } as Partial<Mix>)}
                      className={cn(OPTION, "px-3 py-2", checked ? "site-raised" : "hover:site-chip")}
                    >
                      <span style={{ fontFamily: font.css }} className="min-w-0 flex-1 truncate text-[17px] leading-6 text-ink">
                        {font.family}
                      </span>
                      <span className="shrink-0 text-[11px] text-faint">{fontHome(font.family)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null,
        )}
      </div>
    </>
  );
}

/**
 * The heading's weight, set in the face itself. Only the weights the face has
 * are offered; one that is missing would be a bold the browser fakes.
 */
function HeadingWeight({ mix, update }: { mix: Mix; update: (patch: Partial<Mix>) => void }) {
  const labelId = useId();
  const shown = nearestWeight(mix.heading, mix.headingWeight);
  const family = FONTS.find((font) => font.family === mix.heading)?.css;
  const options = weightOptions(mix.heading);
  return (
    <div className="space-y-1.5">
      <span id={labelId} className="block px-1 text-[11px] text-faint">
        Weight{options.length === 1 ? ` · ${mix.heading} comes in one weight` : ""}
      </span>
      <div role="radiogroup" aria-labelledby={labelId} className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const checked = String(shown) === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={checked}
              onClick={() => update({ headingWeight: Number(option.value) })}
              style={{ fontFamily: family, fontWeight: Number(option.value) }}
              className={cn(
                "h-8 rounded-full px-3 text-[13.5px] transition-colors focus-visible:outline-2 focus-visible:outline-ring",
                checked ? "site-raised text-ink" : "site-chip text-dim hover:text-ink",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const MAIN_COLOURS: KeyColour[] = ["ground", "card", "ink", "dim", "lead"];
const MORE_COLOURS: KeyColour[] = ["paper", "brand", "go", "hold", "stop"];

/** What each colour is read against, for the ratio beside it. */

function ColourStep({
  mix,
  setMix,
  theme,
  mode,
  setMode,
}: {
  mix: Mix;
  setMix: SetMix;
  theme: Theme;
  mode: Mode;
  setMode: (mode: Mode) => void;
}) {
  const paletteId = useId();
  const [more, setMore] = useState(() => MORE_COLOURS.some((token) => mix.light[token] || mix.dark[token]));
  const changed = Object.keys(mix.light).length + Object.keys(mix.dark).length > 0;
  const paint = (token: KeyColour, hex: string) => setMix((now) => ({ ...now, [mode]: { ...now[mode], [token]: hex } }));

  const rows = (tokens: KeyColour[]) => (
    <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-x-2 gap-y-2">
      {tokens.map((token) => {
        const label = KEY_COLOURS.find((key) => key.token === token)?.label ?? token;
        const value = theme[mode][token];
        return (
          <div key={token} className="contents">
            <span className="truncate text-[13px] text-foreground">{label}</span>
            <Swatch label={`${label}, ${mode}`} token={token} mode={mode} theme={theme} changed={Boolean(mix[mode][token])} onChange={(hex) => paint(token, hex)} />
            <HexField label={`${label} hex, ${mode}`} value={value} onChange={(hex) => paint(token, hex)} />
            <Ratio token={token} theme={theme} mode={mode} />
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      <div className="space-y-1.5">
        <span id={paletteId} className="block text-[12px] text-dim">
          Palette
        </span>
        <div role="radiogroup" aria-labelledby={paletteId} className="grid grid-cols-2 gap-0.5 sm:grid-cols-3">
          {THEMES.map((system) => {
            const checked = mix.colours === system.slug;
            return (
              <button
                key={system.slug}
                type="button"
                role="radio"
                aria-checked={checked}
                onClick={() => setMix((now) => ({ ...now, colours: system.slug, light: {}, dark: {} }))}
                className={cn(OPTION, "gap-2 p-1.5 text-[12.5px]", checked ? "site-raised text-ink" : "text-dim hover:site-chip hover:text-ink")}
              >
                <SystemIcon slug={system.slug} />
                <span className="truncate">{system.name}</span>
              </button>
            );
          })}
        </div>
        {/* Always shown: appearing after the first repaint would shift the rows being edited. */}
        <p className="text-[12px] leading-5 text-dim">Picking another palette clears any colours you repaint below.</p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Segmented label="Mode to edit" value={mode} options={MODE_OPTIONS} onChange={setMode} className="w-40" />
          {changed ? (
            <button
              type="button"
              onClick={() => setMix((now) => ({ ...now, light: {}, dark: {} }))}
              className="inline-flex items-center gap-1 text-[12px] text-dim transition-colors hover:text-ink"
            >
              <RotateCcw aria-hidden="true" className="size-3" />
              Reset
            </button>
          ) : null}
        </div>
        {rows(MAIN_COLOURS)}
        <button
          type="button"
          aria-expanded={more}
          onClick={() => setMore((open) => !open)}
          className="inline-flex items-center gap-1 text-[12px] text-dim transition-colors hover:text-ink"
        >
          <ChevronDown aria-hidden="true" className={cn("size-3.5 transition-transform", more && "rotate-180")} />
          {more ? "Fewer colours" : "Inset, brand and states"}
        </button>
        {more ? rows(MORE_COLOURS) : null}
      </div>

      <p className="text-[12px] leading-5 text-dim">
        The number beside a colour is its contrast against what it sits on; red is under the 4.5:1 body text needs. You are editing {mode} mode; switch above to set the other.
      </p>
    </>
  );
}

function Ratio({ token, theme, mode }: { token: KeyColour; theme: Theme; mode: Mode }) {
  const pair = AGAINST[token];
  if (!pair) return <span />;
  const ratio = contrastRatio(theme[mode][pair.fg], theme[mode][pair.bg]);
  const shown = (Math.floor(ratio * 10) / 10).toFixed(1);
  return (
    <span
      title={`${shown}:1 ${pair.on} · ${textContrastResult(ratio)}`}
      className={cn("w-9 text-right font-mono text-[11px] tabular-nums", ratio >= 4.5 ? "text-dim" : "text-stop")}
    >
      {shown}
      <span className="sr-only">
        :1 {pair.on}, {textContrastResult(ratio)}
      </span>
    </span>
  );
}

const SHAPES = [
  { label: "Sharp", panel: 2, inset: 2 },
  { label: "Crisp", panel: 8, inset: 4 },
  { label: "Soft", panel: 14, inset: 8 },
  { label: "Round", panel: 22, inset: 12 },
];

function ShapeStep({ mix, update }: { mix: Mix; update: (patch: Partial<Mix>) => void }) {
  return (
    <>
      <div role="radiogroup" aria-label="Corners" className="grid grid-cols-2 gap-2">
        {SHAPES.map((shape) => {
          const checked = mix.panel === shape.panel && mix.inset === shape.inset;
          return (
            <button
              key={shape.label}
              type="button"
              role="radio"
              aria-checked={checked}
              onClick={() => update({ panel: shape.panel, inset: shape.inset })}
              className={cn(
                "space-y-2 rounded-xl p-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-ring",
                checked ? "site-raised" : "hover:site-chip",
              )}
            >
              <span aria-hidden="true" className="block border border-dim/50 p-2" style={{ borderRadius: shape.panel }}>
                <span className="block h-6 bg-dim/30" style={{ borderRadius: shape.inset }} />
              </span>
              <span className="flex items-baseline justify-between gap-2 text-[12px]">
                <span className="font-medium text-ink">{shape.label}</span>
                <span className="text-faint tabular-nums">
                  {shape.panel} / {shape.inset}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="space-y-1.5">
        <span className="block text-[12px] text-dim">Buttons</span>
        <Segmented
          label="Buttons"
          value={mix.pill}
          options={[
            { value: true, label: "Pill" },
            { value: false, label: "Match inner corners" },
          ]}
          onChange={(pill) => update({ pill })}
        />
      </div>
      <div className="space-y-4">
        <Range label="Card corners" value={mix.panel} onChange={(panel) => update({ panel })} />
        <Range label="Inner corners" value={mix.inset} onChange={(inset) => update({ inset })} />
      </div>
    </>
  );
}

function ComponentsStep({ mix, update, catalog }: { mix: Mix; update: (patch: Partial<Mix>) => void; catalog: Part[] }) {
  const picked = new Set(mix.parts);
  const full = mix.parts.length >= PARTS_MAX;
  const groups = [
    ...CATEGORIES.map(({ slug, label }) => ({ label, parts: catalog.filter((part) => part.category === slug) })),
    { label: "Other", parts: catalog.filter((part) => !CATEGORIES.some(({ slug }) => slug === part.category)) },
  ].filter(({ parts }) => parts.length);
  const toggle = (name: string) =>
    update({ parts: picked.has(name) ? mix.parts.filter((other) => other !== name) : [...mix.parts, name] });

  return (
    <>
      <div className="flex items-center justify-between gap-3 text-[12px]">
        <span className="text-dim" aria-live="polite">
          {mix.parts.length ? `${mix.parts.length} picked${full ? " (the most a link holds)" : ""}` : "None picked yet"}
        </span>
        {mix.parts.length ? (
          <button type="button" onClick={() => update({ parts: [] })} className="text-dim transition-colors hover:text-ink">
            Clear
          </button>
        ) : null}
      </div>
      {groups.map((group) => (
        <fieldset key={group.label} className="space-y-0.5">
          <legend className="mb-1 px-1 text-[11px] text-faint">{group.label}</legend>
          {group.parts.map((part) => {
            const on = picked.has(part.name);
            const blocked = !on && full;
            return (
              <label
                key={part.name}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-1.5 py-1.5 transition-colors has-focus-visible:outline-2 has-focus-visible:outline-ring",
                  on ? "site-raised" : "hover:site-chip",
                  blocked ? "cursor-not-allowed opacity-50" : "cursor-pointer",
                )}
              >
                <input type="checkbox" checked={on} disabled={blocked} onChange={() => toggle(part.name)} className="sr-only" />
                <ItemIcon name={part.name} />
                <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{part.title}</span>
                <span
                  aria-hidden="true"
                  className={cn("grid size-4 shrink-0 place-items-center rounded-[5px]", on ? "bg-ink text-on-solid" : "ring-1 ring-rule ring-inset")}
                >
                  {on ? <Check className="size-3" strokeWidth={3} /> : null}
                </span>
              </label>
            );
          })}
        </fieldset>
      ))}
    </>
  );
}

function ReviewStep({ mix, theme, catalog, toStep }: { mix: Mix; theme: Theme; catalog: Part[]; toStep: (step: Step) => void }) {
  const files = useMemo(() => ({ ts: mixThemeFile(theme, mix) }), [theme, mix]);
  const parts = mix.parts.flatMap((name) => catalog.filter((part) => part.name === name));
  const repainted = new Set([...Object.keys(mix.light), ...Object.keys(mix.dark)]).size;
  const rows: { label: string; value: string; step: Step }[] = [
    { label: "Name", value: mix.name.trim() || "Untitled", step: "start" },
    { label: "Started from", value: getTheme(mix.base)?.name ?? mix.base, step: "start" },
    { label: "Text", value: `${mix.heading}, ${mix.body}, ${mix.mono}`, step: "text" },
    {
      label: "Colours",
      value: `${getTheme(mix.colours)?.name ?? mix.colours} palette${repainted ? `, ${repainted} repainted` : ""}`,
      step: "colour",
    },
    { label: "Corners", value: `${mix.panel}px cards, ${mix.inset}px inside, ${mix.pill ? "pill" : "matching"} buttons`, step: "shape" },
    { label: "Components", value: parts.length ? parts.map(({ title }) => title).join(", ") : "None", step: "components" },
  ];
  const contrast = MODES.map((mode) => {
    const checks = themeContrast(theme[mode]);
    return `${mode} ${checks.filter((check) => check.passes).length}/${checks.length}`;
  }).join(", ");

  return (
    <>
      <dl className="divide-y divide-rule-soft">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start gap-3 py-2.5 first:pt-0">
            <dt className="w-24 shrink-0 text-[12px] leading-5 text-dim">{row.label}</dt>
            <dd className="min-w-0 flex-1 text-[13px] leading-5 text-ink">{row.value}</dd>
            <dd className="shrink-0">
              <button type="button" onClick={() => toStep(row.step)} className="text-[12px] leading-5 text-dim transition-colors hover:text-ink">
                Edit<span className="sr-only"> {row.label.toLowerCase()}</span>
              </button>
            </dd>
          </div>
        ))}
      </dl>

      <p className="text-[12px] leading-5 text-dim">Contrast: {contrast} pairs meet AA. The full check is under the preview.</p>

      <MixCopyMenu
        theme={theme}
        parts={parts.map(({ name }) => name)}
        themeFile={() => files.ts}
        link={`${SITE_URL}/systems/mix?${mixParams(mix)}`}
      />
    </>
  );
}
