"use client";

import { Suspense, useEffect, useRef, useState, useSyncExternalStore, type ReactNode, type RefObject } from "react";
import { useTheme } from "next-themes";
import { MIX_SLUG } from "@/lib/mix";
import { cn } from "@/lib/utils";
import type { Theme } from "@/themes/types";
import type { Part } from "./mix-flow";
import { MODES, Segmented, type Mode } from "./mix-controls";
import { ThemeAccessibility } from "./theme-accessibility";
import { ThemeScene } from "./theme-scene";

const subscribeNever = () => () => {};

const MODE_OPTIONS = MODES.map((mode) => ({ value: mode, label: mode === "light" ? "Light" : "Dark" }));

/**
 * The preview's own light/dark switch, so both modes can be checked without
 * flipping the whole site. Until a mode is picked it follows the site; the
 * server cannot know the site's mode, so the first render guesses light like
 * it does. `mode` is what was picked, `shown` what is on screen.
 */
export function usePreviewMode() {
  const { resolvedTheme } = useTheme();
  const hydrated = useSyncExternalStore(subscribeNever, () => true, () => false);
  const [mode, setMode] = useState<Mode | null>(null);
  const shown: Mode = mode ?? (hydrated && resolvedTheme === "dark" ? "dark" : "light");
  return { mode, shown, setMode };
}

/**
 * The mix, the same in every step and in the editor: the sample scene, the
 * components, then the contrast check. Nothing here changes with the step or
 * the system a mix starts from, so a change in the controls is the only thing
 * that changes what you see.
 */
export function MixPreview({
  theme,
  parts,
  picked,
  mode,
  shown,
  setMode,
  onPick,
  pinHeader,
  fitTo,
}: {
  theme: Theme;
  parts: Part[];
  picked: boolean;
  mode: Mode | null;
  shown: Mode;
  setMode: (mode: Mode) => void;
  /** Offered beside the examples while nothing is picked. */
  onPick?: () => void;
  /** At xl, keep the title and mode switch at the top of a preview that scrolls in its own box. */
  pinHeader?: boolean;
  /**
   * The steps' layout: no "Preview · name" label, and at xl no header at all
   * (the mode switch moves up beside the title), with the scene shrunk to fit
   * the height of `fitTo` so all of it is always in view.
   */
  fitTo?: RefObject<HTMLElement | null>;
}) {
  const scene = <ThemeScene theme={theme} />;
  return (
    <div className="min-w-0 space-y-3">
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-3",
          pinHeader && "xl:sticky xl:top-0 xl:z-10 xl:bg-(--site-bg) xl:pb-1",
          fitTo && "justify-end xl:hidden",
        )}
      >
        {fitTo ? null : (
          <p className="text-[13px] leading-5 font-medium text-ink">
            Preview <span className="font-normal text-dim">· {theme.name}</span>
          </p>
        )}
        <Segmented label="Preview in" value={shown} options={MODE_OPTIONS} onChange={setMode} className="w-40" />
      </div>
      {/* Once a mode is picked, a mode island: `.dark` or `[data-mode="light"]` repaints the mix whatever the site is in. */}
      <div data-mode={mode ?? undefined} className={cn("space-y-3", mode === "dark" && "dark")} style={mode ? { colorScheme: mode } : undefined}>
        <div id="mix-scene">{fitTo ? <FitToHeight to={fitTo}>{scene}</FitToHeight> : scene}</div>
        <PartsPreview parts={parts} picked={picked} onPick={onPick} />
      </div>
      <div className="site-stage rounded-2xl p-3 sm:p-4">
        <ThemeAccessibility theme={theme} />
      </div>
    </div>
  );
}

/**
 * At xl, shrinks its content to the height of `to` when it is taller, so it
 * is always seen whole; at full size when it fits, and untouched under xl.
 * The outer box takes the shrunk height, so what follows sits right under it.
 */
function FitToHeight({ to, children }: { to: RefObject<HTMLElement | null>; children: ReactNode }) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<{ scale: number; height: number } | null>(null);

  useEffect(() => {
    const box = to.current;
    const inner = innerRef.current;
    if (!box || !inner) return;
    const wide = window.matchMedia("(min-width: 80rem)");
    const measure = () => {
      // offsetHeight ignores the transform, so this is always the natural height.
      const natural = inner.offsetHeight;
      const scale = wide.matches && natural > 0 ? Math.min(1, box.clientHeight / natural) : 1;
      setFit(scale < 1 ? { scale, height: natural * scale } : null);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    observer.observe(inner);
    wide.addEventListener("change", measure);
    measure();
    return () => {
      observer.disconnect();
      wide.removeEventListener("change", measure);
    };
  }, [to]);

  return (
    <div style={fit ? { height: fit.height } : undefined}>
      <div ref={innerRef} style={fit ? { transform: `scale(${fit.scale})`, transformOrigin: "top center" } : undefined}>
        {children}
      </div>
    </div>
  );
}

/** Registry items in the mix, on its own page colour. */
function PartsPreview({ parts, picked, onPick }: { parts: Part[]; picked: boolean; onPick?: () => void }) {
  return (
    <div data-theme={MIX_SLUG} className="@container space-y-3 rounded-2xl bg-ground p-3 sm:p-4">
      <p className="px-1 font-body text-[12.5px] text-dim">
        {picked ? (
          "Your components"
        ) : onPick ? (
          <>
            Examples.{" "}
            <button type="button" onClick={onPick} className="text-lead underline underline-offset-2">
              Pick your own
            </button>
          </>
        ) : (
          "Nothing picked yet, so these are examples."
        )}
      </p>
      {/* Two across only when the preview is wide enough for them; it is narrower than the gallery. */}
      <div className="grid grid-cols-1 gap-3 @3xl:grid-cols-2">
        {parts.map((part) => (
          <div
            key={part.name}
            className={cn("relative isolate flex min-h-40 min-w-0 items-center rounded-panel border border-rule-soft px-4 py-8 sm:px-8", part.full && "@3xl:col-span-2")}
          >
            <div className="flex w-full justify-center">
              <Suspense fallback={null}>{part.preview}</Suspense>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
