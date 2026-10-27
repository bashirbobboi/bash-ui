"use client";

import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { useReducedMotionConfig } from "motion/react";
import { Fragment, useRef, useState, type ReactNode } from "react";
import { componentCode, componentPrompt, type ItemSource } from "@/lib/prompts";
import { getItem } from "@/registry/items";
import { getTheme } from "@/themes";
import type { PlaygroundSpec, PlaygroundValues } from "@/registry/types";
import { CodeBlock } from "./code-block";
import { CopyMenu } from "./copy-menu";
import { Control, ControlGroup, PillChoice } from "./playground-controls";
import { PillTabs } from "./pill-tabs";
import { ReplayButton, SteadySurface, Tile, TileGrid } from "./tiles";

export type CategoryItem = {
  name: string;
  title: string;
  /** The design system of the project it came from: its tile renders in it. */
  home: string;
  /** What the code panel imports from, e.g. `@/components/ui/send-button`. */
  importPath: string;
};

type View = "preview" | "install";

function defaults(spec: PlaygroundSpec): PlaygroundValues {
  return Object.fromEntries(spec.controls.map((control) => [control.name, control.default]));
}

function attribute(name: string, value: string | number | boolean): string {
  if (typeof value === "boolean") return value ? name : `${name}={false}`;
  if (typeof value === "number") return `${name}={${value}}`;
  return `${name}="${value.replace(/"/g, "&quot;")}"`;
}

/**
 * The usage the playground's current settings amount to. Every setting is
 * printed: a playground's starting value is not always the component's own
 * default, so leaving "defaults" out would print code that renders something
 * else. Only an off switch and an empty text are left out, since leaving those
 * props off says the same thing.
 */
function codeFor(spec: PlaygroundSpec, values: PlaygroundValues, importPath: string): string {
  const attrs = [
    ...spec.controls
      .filter((control) => values[control.name] !== false && values[control.name] !== "")
      .map((control) => attribute(control.name, values[control.name])),
    ...(spec.codeProps ?? []),
  ];
  const single = `<${spec.component}${attrs.map((attr) => ` ${attr}`).join("")} />`;
  const jsx =
    single.length <= 72 ? single : `<${spec.component}\n${attrs.map((attr) => `  ${attr}`).join("\n")}\n/>`;
  return `import { ${spec.component} } from "${importPath}";\n\n${jsx}`;
}

/**
 * A category's page body: every member once, in a gap-free grid, then a
 * playground that focuses on one member at a time. Install & Usage swaps the
 * grid for the focused member's install steps, props and source.
 *
 * Which member is focused is the URL (`/components/<name>`), kept in step with
 * `replaceState` so the sidebar follows and a link to it is shareable.
 *
 * `reveal` is the member a link pointed at: its tile is brought into view and
 * marked when the page opens, so siblings' links don't all land on the top.
 */
export function CategoryView({
  items,
  initialFocus,
  reveal,
  themes,
  sources,
  install,
}: {
  items: CategoryItem[];
  initialFocus: string;
  reveal?: string;
  themes: { slug: string; label: string }[];
  sources: Record<string, ItemSource>;
  install: Record<string, ReactNode>;
}) {
  const reduce = useReducedMotionConfig();
  const playgroundRef = useRef<HTMLElement>(null);
  const [view, setView] = useState<View>("preview");
  const [focus, setFocus] = useState(initialFocus);
  const focused = items.find((item) => item.name === focus) ?? items[0];
  const spec = getItem(focused.name)?.playground;
  const [values, setValues] = useState<PlaygroundValues>(() => (spec ? defaults(spec) : {}));
  const [theme, setTheme] = useState(focused.home);
  const [run, setRun] = useState(0);
  const replay = getItem(focused.name)?.meta.previewReplay;

  function focusOn(name: string, scroll = false) {
    const next = items.find((item) => item.name === name);
    const nextSpec = getItem(name)?.playground;
    if (!next || !nextSpec) return;
    setFocus(name);
    setValues(defaults(nextSpec));
    setTheme(next.home);
    window.history.replaceState(null, "", `/components/${name}`);
    if (scroll) playgroundRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  const itemOptions = items.map((item) => ({ value: item.name, label: item.title }));
  const revealIndex = items.findIndex((item) => item.name === reveal);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <PillTabs
          label="View"
          value={view}
          onChange={setView}
          className="-ml-[3px]"
          tabs={[
            { value: "preview", label: "Preview" },
            { value: "install", label: "Install & Usage" },
          ]}
        />
        <CopyMenu
          prompt={(agent) => {
            const meta = getItem(focused.name)?.meta;
            const system = getTheme(theme) ?? getTheme(focused.home);
            return meta && system ? componentPrompt(meta, agent, system, sources[focused.name]) : "";
          }}
          promptHint={(agent) => `${agent.install === "cli" ? "Install steps" : "The source"} and how to use it, written for ${agent.name}.`}
          code={{ label: "Copy code", hint: "The source, to paste in yourself.", value: () => componentCode(sources[focused.name]) }}
          image={{
            target: "#playground-stage",
            hint: "The playground as a PNG, to paste into a chat.",
            missing: "Switch to Preview to copy the playground.",
          }}
        />
      </div>

      {view === "install" ? (
        <div className="space-y-3">
          <PillChoice label="Component" options={itemOptions} value={focused.name} onChange={(name) => focusOn(name)} />
          <div className="site-stage space-y-6 rounded-2xl p-3 sm:p-4">{install[focused.name]}</div>
        </div>
      ) : (
        <>
          <TileGrid reveal={revealIndex >= 0 ? revealIndex : undefined}>
            {items.map((item) => {
              const Preview = getItem(item.name)?.Preview;
              return (
                <Tile
                  key={item.name}
                  theme={item.home}
                  label={item.title}
                  replay={getItem(item.name)?.meta.previewReplay}
                  grow={getItem(item.name)?.meta.previewGrow}
                  className={getItem(item.name)?.meta.previewWidth === "full" ? "md:col-span-2" : undefined}
                  corner={
                    <button
                      type="button"
                      onClick={() => focusOn(item.name, true)}
                      className="site-chip inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium text-ink"
                    >
                      <SlidersHorizontal className="size-3" aria-hidden="true" />
                      Playground
                    </button>
                  }
                >
                  {Preview ? <Preview /> : null}
                </Tile>
              );
            })}
          </TileGrid>

          {spec ? (
            <section ref={playgroundRef} aria-label="Playground" className="space-y-3 pt-7">
              <h2 className="text-[15px] leading-5 font-medium text-ink">Playground</h2>
              {/* `grid-cols-1` (minmax(0, 1fr)) under lg: an implicit column would grow to the widest chart. */}
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_300px]">
                <SteadySurface
                  id="playground-stage"
                  theme={theme}
                  grow={getItem(focused.name)?.meta.previewGrow}
                  resetKey={`${focused.name}|${theme}|${JSON.stringify(values)}`}
                  className="site-stage min-h-[420px] items-center rounded-2xl px-6 py-12 sm:px-10"
                  overlay={replay ? (
                    <div data-capture-skip className="absolute top-3 right-3">
                      <ReplayButton onReplay={() => setRun((count) => count + 1)} />
                    </div>
                  ) : null}
                >
                  <Fragment key={run}>{spec.render(values)}</Fragment>
                </SteadySurface>

                <div className="site-panel space-y-5 rounded-2xl p-4">
                  <ControlGroup label="Component">
                    <PillChoice
                      label="Component"
                      options={itemOptions}
                      value={focused.name}
                      onChange={(name) => focusOn(name)}
                    />
                  </ControlGroup>
                  <ControlGroup label="Design system">
                    <PillChoice
                      label="Design system"
                      options={themes.map((option) => ({ value: option.slug, label: option.label }))}
                      value={theme}
                      onChange={setTheme}
                    />
                  </ControlGroup>
                  <div className="h-px bg-[var(--site-chip)]" />
                  {spec.controls.map((control) => (
                    <Control
                      key={`${focused.name}:${control.name}`}
                      control={control}
                      values={values}
                      onChange={(name, value) => setValues((current) => ({ ...current, [name]: value }))}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => setValues(defaults(spec))}
                    className="inline-flex items-center gap-1.5 text-[12px] font-medium text-dim transition-colors hover:text-ink"
                  >
                    <RotateCcw className="size-3" aria-hidden="true" />
                    Reset
                  </button>
                </div>
              </div>
              <CodeBlock code={codeFor(spec, values, focused.importPath)} />
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
