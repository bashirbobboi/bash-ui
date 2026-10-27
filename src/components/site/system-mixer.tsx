"use client";

import { useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { ListOrdered, RotateCcw } from "lucide-react";
import { KEY_COLOURS, mixFrom, mixParams, mixThemeFile, nearestWeight, type KeyColour, type Mix } from "@/lib/mix";
import { SITE_URL } from "@/lib/site";
import { cn } from "@/lib/utils";
import type { Theme } from "@/themes/types";
import { Ghost } from "./ghost";
import { Swatch } from "./colour-picker";
import { MixCopyMenu } from "./copy-menu";
import { CONTROL, FONT_OPTIONS, Field, Group, MODES, ProgressiveBlur, Range, SYSTEM_OPTIONS, Segmented, Select, weightOptions, type Mode } from "./mix-controls";
import { partsFor, type Part } from "./mix-flow";
import { MixPreview, usePreviewMode } from "./mix-preview";

/**
 * The playground's editor: every control at once on the left, the mix on
 * the right in the same preview the steps show. The components are the ones
 * picked in the steps, or a sample set while none are.
 */
export function SystemMixer({
  mix,
  setMix,
  theme,
  catalog,
  onSteps,
  title,
}: {
  title?: ReactNode;
  mix: Mix;
  setMix: Dispatch<SetStateAction<Mix>>;
  theme: Theme;
  catalog: Part[];
  onSteps: () => void;
}) {
  const query = mixParams(mix);
  const files = useMemo(() => ({ ts: mixThemeFile(theme, mix) }), [theme, mix]);
  const changed = Object.keys(mix.light).length + Object.keys(mix.dark).length > 0;
  const { parts, picked } = partsFor(catalog, mix.parts);
  const { mode, shown, setMode } = usePreviewMode();

  const update = (patch: Partial<Mix>) => setMix((current) => ({ ...current, ...patch }));
  const paint = (mode: Mode, token: KeyColour, hex: string) =>
    setMix((current) => ({ ...current, [mode]: { ...current[mode], [token]: hex } }));

  return (
    // At xl the editor fills the window and the page stops scrolling (-mt
    // halves <main>'s top padding, -mb cancels its bottom one; the height is
    // the window less the header and 1rem above and below). The controls and
    // the preview each scroll on their own, and "Take it with you" stays
    // pinned at the foot of the controls.
    <div className="space-y-3 xl:-mt-4 xl:-mb-24 xl:flex xl:h-[calc(100dvh-var(--header-h)-2rem)] xl:flex-col">
      <div className="xl:hidden">{title}</div>
      <h1 className="hidden text-[24px] leading-tight font-medium tracking-[-0.005em] text-ink xl:block">Playground</h1>
      <div className="grid gap-3 xl:min-h-0 xl:flex-1 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="site-stage rounded-2xl xl:relative xl:flex xl:min-h-0 xl:flex-col xl:overflow-hidden">
          <div className="space-y-7 p-4 sm:p-5 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:overscroll-contain xl:pb-20">
            <Group title="Start" action={<MixGhost colour={theme.light.brand} change={query} />}>
              <Field label="Name">
                <input
                  value={mix.name}
                  onChange={(event) => update({ name: event.target.value })}
                  placeholder="Untitled"
                  className={cn(CONTROL, "px-3 placeholder:text-faint")}
                />
              </Field>
              <Field label="Start from">
                <Select value={mix.base} options={SYSTEM_OPTIONS} onChange={(slug) => setMix({ ...mixFrom(slug, mix.name), parts: mix.parts })} />
              </Field>
              <button
                type="button"
                onClick={onSteps}
                className="inline-flex items-center gap-1.5 text-[12px] text-dim transition-colors hover:text-ink"
              >
                <ListOrdered aria-hidden="true" className="size-3.5" />
                Go through it in steps
              </button>
            </Group>

            <Group title="Mix">
              <Field label="Colours from">
                <Select value={mix.colours} options={SYSTEM_OPTIONS} onChange={(colours) => update({ colours, light: {}, dark: {} })} />
              </Field>
              <Field label="Headings">
                <Select value={mix.heading} options={FONT_OPTIONS} onChange={(heading) => update({ heading })} />
              </Field>
              <Field label="Heading weight">
                <Select
                  value={String(nearestWeight(mix.heading, mix.headingWeight))}
                  options={weightOptions(mix.heading)}
                  onChange={(weight) => update({ headingWeight: Number(weight) })}
                />
              </Field>
              <Field label="Body">
                <Select value={mix.body} options={FONT_OPTIONS} onChange={(body) => update({ body })} />
              </Field>
              <Field label="Monospace">
                <Select value={mix.mono} options={FONT_OPTIONS} onChange={(mono) => update({ mono })} />
              </Field>
            </Group>

            <Group
              title="Colours"
              action={
                changed ? (
                  <button
                    type="button"
                    onClick={() => update({ light: {}, dark: {} })}
                    className="inline-flex items-center gap-1 text-[12px] text-dim transition-colors hover:text-ink"
                  >
                    <RotateCcw className="size-3" />
                    Reset
                  </button>
                ) : null
              }
            >
              <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-3 gap-y-2">
                <span />
                <span className="w-8 text-center text-[11px] text-faint">Light</span>
                <span className="w-8 text-center text-[11px] text-faint">Dark</span>
                {KEY_COLOURS.map(({ token, label }) => (
                  <div key={token} className="contents">
                    <span className="truncate text-[13px] text-foreground">{label}</span>
                    {MODES.map((mode) => (
                      <Swatch
                        key={mode}
                        label={`${label}, ${mode}`}
                        token={token}
                        mode={mode}
                        theme={theme}
                        changed={Boolean(mix[mode][token])}
                        onChange={(hex) => paint(mode, token, hex)}
                      />
                    ))}
                  </div>
                ))}
              </div>
              <p className="text-[12px] leading-5 text-dim">Borders, quiet text and state fills follow the colours you change.</p>
            </Group>

            <Group title="Shape">
              <Range label="Card corners" value={mix.panel} onChange={(panel) => update({ panel })} />
              <Range label="Inner corners" value={mix.inset} onChange={(inset) => update({ inset })} />
              <div className="space-y-1.5">
                <span className="block text-[12px] text-dim">Buttons</span>
                <Segmented
                  label="Buttons"
                  value={mix.pill}
                  options={[
                    { value: true, label: "Pill" },
                    { value: false, label: "Inner corners" },
                  ]}
                  onChange={(pill) => update({ pill })}
                />
              </div>
            </Group>
          </div>

          {/* The way out, floating over the foot of the controls: what scrolls
              passes under it through a progressive blur. Under xl it simply
              closes the panel. */}
          <ProgressiveBlur className="absolute inset-x-0 bottom-0 hidden h-24 xl:block" />
          <div className="px-4 pb-4 sm:px-5 sm:pb-5 xl:absolute xl:inset-x-0 xl:bottom-0">
            <MixCopyMenu
              theme={theme}
              parts={picked ? parts.map(({ name }) => name) : []}
              themeFile={() => files.ts}
              link={`${SITE_URL}/systems/mix?${query}`}
            />
          </div>
        </aside>

        <div className="min-w-0 xl:min-h-0 xl:overflow-y-auto xl:overscroll-contain">
          <MixPreview theme={theme} parts={parts} picked={picked} mode={mode} shown={shown} setMode={setMode} pinHeader />
        </div>
      </div>
    </div>
  );
}

/**
 * The ghost in the mix's brand colour. It hops while the mix is changing and
 * settles a moment after the last change, so a dragged colour keeps it busy.
 */
function MixGhost({ colour, change }: { colour: string; change: string }) {
  const [settled, setSettled] = useState(change);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(change), 1200);
    return () => clearTimeout(timer);
  }, [change]);
  return <Ghost size={40} color={colour} state={settled === change ? "default" : "working"} className="-my-2.5" />;
}
