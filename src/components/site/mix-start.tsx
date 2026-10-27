"use client";

import { ArrowRight, History, Plus } from "lucide-react";
import { getTheme, THEMES } from "@/themes";
import { ItemIcon, SystemIcon } from "./item-icon";
import { STEPS } from "./mix-flow";

/**
 * The playground's front door: start a new system in steps, open one of the
 * six in the editor to remix, or pick up the last one this browser kept.
 */
export function MixStart({
  draft,
  onNew,
  onRemix,
  onContinue,
}: {
  draft: string | null;
  onNew: () => void;
  onRemix: (slug: string) => void;
  onContinue: (draft: string) => void;
}) {
  const saved = draft ? describeDraft(draft) : null;

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-start">
      <div className="group site-stage relative flex flex-col gap-8 rounded-2xl p-5 transition-[background-color,box-shadow] duration-150 hover:site-raised sm:p-8">
        <ItemIcon name="new-system" icon={Plus} size="lg" />
        <div className="space-y-2">
          <h2 className="text-[22px] leading-tight font-medium tracking-[-0.01em] text-ink">
            <button
              type="button"
              onClick={onNew}
              className="text-left after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-ring"
            >
              New design system
            </button>
          </h2>
          <p className="max-w-md text-[14px] leading-[22px] text-dim">
            A few short steps: a name and a starting point, then your type, colours and corners, and the components to try it on. The preview builds as you go.
          </p>
        </div>
        <ol className="flex flex-wrap gap-1.5" aria-label="Steps">
          {STEPS.map(({ id, label }, index) => (
            <li key={id} className="site-chip inline-flex h-7 items-center gap-1.5 rounded-full pr-3 pl-1 text-[12px] text-dim">
              <span className="site-raised grid size-5 place-items-center rounded-full text-[11px] text-ink tabular-nums">{index + 1}</span>
              {label}
            </li>
          ))}
        </ol>
      </div>

      <div className="space-y-3">
        {saved ? (
          <div className="group site-stage relative flex items-center gap-3 rounded-2xl p-4 transition-[background-color,box-shadow] duration-150 hover:site-raised">
            <ItemIcon name="continue" icon={History} />
            <div className="min-w-0 flex-1">
              <h2 className="text-[13px] leading-5 font-medium text-ink">
                <button
                  type="button"
                  onClick={() => draft && onContinue(draft)}
                  className="text-left after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-ring"
                >
                  Continue {saved.name}
                </button>
              </h2>
              <p className="truncate text-[12px] leading-5 text-dim">{saved.where}</p>
            </div>
            <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-dim transition-colors group-hover:text-ink" />
          </div>
        ) : null}

        <section className="site-stage space-y-3 rounded-2xl p-4">
          <div className="space-y-1">
            <h2 className="text-[13px] leading-5 font-medium text-ink">Remix a system</h2>
            <p className="text-[12px] leading-5 text-dim">Open one in the editor and change what you like.</p>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {THEMES.map((theme) => (
              <button
                key={theme.slug}
                type="button"
                onClick={() => onRemix(theme.slug)}
                className="flex min-w-0 items-center gap-2.5 rounded-xl p-2 text-left transition-colors hover:site-chip focus-visible:outline-2 focus-visible:outline-ring"
              >
                <SystemIcon slug={theme.slug} />
                <span className="min-w-0">
                  <span className="block truncate text-[13px] leading-5 text-ink">{theme.name}</span>
                  <span className="block truncate text-[11.5px] leading-4 text-faint">{theme.project}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function describeDraft(draft: string): { name: string; where: string } {
  const params = new URLSearchParams(draft);
  const step = STEPS.findIndex(({ id }) => id === params.get("step"));
  const base = getTheme(params.get("base") ?? "")?.name;
  const where = step >= 0 ? `Step ${step + 1} of ${STEPS.length} · ${STEPS[step].label}` : "In the editor";
  return { name: params.get("name")?.trim() || "Untitled", where: base ? `${where} · from ${base}` : where };
}
