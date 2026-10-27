"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { mixFrom, mixParams, mixTheme, parseMix, type Mix } from "@/lib/mix";
import { scopedThemeCss } from "@/themes";
import { STEPS, type Part, type View } from "./mix-flow";
import { MixStart } from "./mix-start";
import { MixWizard } from "./mix-wizard";
import { SystemMixer } from "./system-mixer";

const DRAFT_KEY = "bash-ui:playground";

function readDraft(): string | null {
  try {
    return window.localStorage.getItem(DRAFT_KEY);
  } catch {
    return null;
  }
}

function subscribeDraft(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function viewFrom(params: URLSearchParams): View {
  const step = STEPS.find(({ id }) => id === params.get("step"))?.id;
  if (step) return { kind: "steps", step };
  return params.has("base") ? { kind: "editor" } : { kind: "welcome" };
}

function queryFor(mix: Mix, view: View): string {
  if (view.kind === "welcome") return "";
  const query = mixParams(mix);
  return view.kind === "steps" ? `step=${view.step}&${query}` : query;
}

function href(query: string): string {
  return query ? `?${query}` : window.location.pathname;
}

/**
 * The playground: a welcome screen, the guided steps, and the editor, over
 * one mix. Which one shows is read from the link (`?step=…` is the steps, a
 * bare mix is the editor, nothing is the welcome), so the browser's back
 * button walks back through the steps and a shared link opens the editor.
 *
 * Moving between views pushes a history entry; changing the mix only replaces
 * the current one, a beat behind, so a dragged colour picker does not flood
 * the history API. The mix itself survives back and forward: going back a
 * step keeps what you chose since. The last mix is also kept in this
 * browser so the welcome screen can offer to continue it.
 */
/** `title` heads every view; the steps and the editor keep it, compact, at the top of a window-high layout. */
export function MixPlayground({ catalog, title }: { catalog: Part[]; title: ReactNode }) {
  const searchParams = useSearchParams();
  const view = viewFrom(new URLSearchParams(searchParams.toString()));
  const known = useMemo(() => new Set(catalog.map((part) => part.name)), [catalog]);
  const clean = (mix: Mix): Mix => ({ ...mix, parts: mix.parts.filter((name) => known.has(name)) });
  const [mix, setMix] = useState(() => clean(parseMix(new URLSearchParams(searchParams.toString()))));
  const theme = useMemo(() => mixTheme(mix), [mix]);
  const query = queryFor(mix, view);
  const draft = useSyncExternalStore(subscribeDraft, readDraft, () => null);
  const opened = useRef(query);

  useEffect(() => {
    if (!query) return;
    const timer = setTimeout(() => {
      window.history.replaceState(null, "", href(query));
      // Opening a link someone shared is not a draft of yours until you change it.
      if (query === opened.current) return;
      try {
        window.localStorage.setItem(DRAFT_KEY, query);
      } catch {
        // Storage blocked (private window, site data off). The link still holds the mix.
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  function go(next: View, nextMix: Mix = mix) {
    // Settle the entry being left first, so coming back to it shows the latest mix.
    window.history.replaceState(null, "", href(query));
    window.history.pushState(null, "", href(queryFor(nextMix, next)));
    if (nextMix !== mix) setMix(nextMix);
    // A different view starts at its top; the steps scroll themselves between steps.
    if (next.kind !== view.kind) window.scrollTo({ top: 0 });
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: scopedThemeCss(theme) }} />
      {view.kind === "welcome" ? <div className="mb-8">{title}</div> : null}
      {view.kind === "welcome" ? (
        <MixStart
          draft={draft}
          onNew={() => go({ kind: "steps", step: "start" }, mixFrom("neutral"))}
          onRemix={(slug) => go({ kind: "editor" }, mixFrom(slug))}
          onContinue={(saved) => {
            const params = new URLSearchParams(saved);
            go(viewFrom(params), clean(parseMix(params)));
          }}
        />
      ) : view.kind === "steps" ? (
        <MixWizard step={view.step} mix={mix} setMix={setMix} theme={theme} catalog={catalog} go={go} title={title} />
      ) : (
        <SystemMixer mix={mix} setMix={setMix} theme={theme} catalog={catalog} onSteps={() => go({ kind: "steps", step: "start" })} title={title} />
      )}
    </>
  );
}
