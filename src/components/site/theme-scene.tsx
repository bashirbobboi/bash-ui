"use client";

import { useId, useState } from "react";
import { PaletteStrip } from "./palette-strip";
import type { Theme, ThemeFontRole, ThemeTone } from "@/themes/types";

const TONES: ThemeTone[] = ["go", "hold", "stop"];
const TONE_CLASS: Record<ThemeTone, { wash: string; dot: string }> = {
  go: { wash: "bg-go-wash text-go", dot: "bg-go" },
  hold: { wash: "bg-hold-wash text-hold", dot: "bg-hold" },
  stop: { wash: "bg-stop-wash text-stop", dot: "bg-stop" },
};
const FILL_CLASS = { ink: "bg-ink text-on-solid", primary: "bg-primary text-primary-foreground", lead: "bg-lead text-on-solid" };
const QUIET_CLASS = { outline: "border border-rule text-ink", tonal: "bg-tonal text-on-tonal" };
/** The sample actions do nothing; they only answer the pointer the way real buttons would. */
const ACTION_CLASS = "cursor-pointer transition duration-200 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lead";
const SPECIMENS: { role: ThemeFontRole; label: string; className: string }[] = [
  { role: "heading", label: "Heading", className: "text-[24px] leading-tight" },
  { role: "serif", label: "Heading 2", className: "text-[24px] leading-tight font-bold" },
  { role: "body", label: "Body", className: "text-[14px] leading-[1.6]" },
  { role: "mono", label: "Monospace", className: "text-[13px] tabular-nums" },
  { role: "interface", label: "Interface", className: "text-[15px] font-medium" },
];

export function ThemeScene({
  theme,
}: {
  /** `light` and `dark` only for a system outside THEMES, such as the playground's mix. */
  theme: Pick<Theme, "slug" | "fonts" | "radius" | "scene"> & Partial<Pick<Theme, "light" | "dark">>;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const recordId = useId();
  const { scene } = theme;
  const face = (role: ThemeFontRole) => theme.fonts[role] ?? theme.fonts.body;
  const highlight = (role: ThemeFontRole) =>
    `box-decoration-clone rounded-[3px] px-0.5 -mx-0.5 transition-colors duration-200 motion-reduce:transition-none ${selected === face(role).family ? "bg-lead-wash text-lead" : ""}`;
  const weight = scene.headingWeight ?? 600;
  const edge = scene.panel === "hairline" ? "border border-rule" : "";
  const pill = scene.actions.shape === "pill";
  const inset = scene.inset === "muted" ? "bg-muted" : "bg-paper";
  const shape = pill ? "rounded-full" : "rounded-inset";
  const actionFont = scene.actions.font ?? "body";
  const [before, after] = scene.emphasis ? scene.title.split(scene.emphasis) : [scene.title];
  const specimens = SPECIMENS.flatMap(({ role, label, className }) => {
    const font = theme.fonts[role];
    const sample = scene.samples[role];
    return font && sample ? [{ role, label, className, font, sample }] : [];
  });

  return (
    <div data-theme={theme.slug} className="overflow-hidden rounded-2xl bg-ground p-4 sm:p-8">
        <div className="grid gap-3 md:grid-cols-2">
          <div id={recordId} className={`space-y-4 rounded-panel bg-card p-5 md:col-span-2 font-body ${edge}`}>
            <div className="space-y-1">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2.5">
                  {scene.eyebrow ? (
                    <p style={{ fontFamily: face(scene.eyebrow.font).css }} className="text-[10.5px] font-medium tracking-[0.09em] text-faint uppercase">
                      <span className={highlight(scene.eyebrow.font)}>{scene.eyebrow.text}</span>
                    </p>
                  ) : null}
                  <h3 style={{ fontWeight: weight }} className="font-heading text-[22px] leading-tight tracking-[-0.02em] text-ink">
                    <span className={highlight("heading")}>
                      {before}
                      {after !== undefined ? <><em>{scene.emphasis}</em>{after}</> : null}
                    </span>
                  </h3>
                </div>
                <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[12px] ${TONE_CLASS[scene.status.tone].wash}`}>
                  <span className={`size-1.5 rounded-full ${TONE_CLASS[scene.status.tone].dot}`} />
                  <span className={highlight("body")}>{scene.status.label}</span>
                </span>
              </div>
              <p className="font-body text-[13.5px] leading-[1.6] text-dim"><span className={highlight("body")}>{scene.blurb}</span></p>
            </div>
            {theme.fonts.serif && scene.section ? (
              <h4 style={{ fontFamily: theme.fonts.serif.css }} className="text-[22px] leading-tight font-bold text-ink"><span className={highlight("serif")}>{scene.section}</span></h4>
            ) : null}
            <div className="grid gap-2 sm:grid-cols-3">
              {scene.stats.map(({ label, value, font = "mono" }) => (
                <div key={label} className={`min-w-0 rounded-inset ${inset} px-3 py-2`}>
                  <div className="text-[11.5px] text-dim"><span className={highlight("body")}>{label}</span></div>
                  <div
                    style={{ fontFamily: face(font).css, fontWeight: font === "heading" ? weight : undefined }}
                    className={`${font === "heading" ? "text-[19px] leading-tight" : "text-[15px]"} text-ink tabular-nums`}
                  >
                    <span className={highlight(font)}>{value}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ fontFamily: face(actionFont).css }} className="flex flex-wrap items-center gap-2 text-[13px]">
              <button type="button" className={`${shape} ${FILL_CLASS[scene.actions.fill]} ${ACTION_CLASS} px-3.5 py-1.5 font-medium hover:opacity-85 active:opacity-75`}><span className={highlight(actionFont)}>{scene.actions.primary}</span></button>
              <button type="button" className={`${shape} ${QUIET_CLASS[scene.actions.quiet]} ${ACTION_CLASS} px-3.5 py-1.5 ${scene.actions.quiet === "outline" ? "hover:bg-paper active:bg-rule" : "hover:opacity-85 active:opacity-75"}`}><span className={highlight(actionFont)}>{scene.actions.secondary}</span></button>
              <button type="button" className={`${ACTION_CLASS} rounded-inset px-1 py-1.5 text-lead underline-offset-4 hover:underline`}><span className={highlight(actionFont)}>{scene.actions.link}</span></button>
            </div>
            {scene.footnote && theme.fonts[scene.footnote.font] ? (
              <p style={{ fontFamily: face(scene.footnote.font).css }} className="text-[12px] font-medium text-dim"><span className={highlight(scene.footnote.font)}>{scene.footnote.text}</span></p>
            ) : null}
          </div>
          <div className={`space-y-2 rounded-panel bg-card p-5 ${edge}`}>
            <h3 className="font-mono text-[10.5px] font-medium tracking-[0.09em] text-faint uppercase">States</h3>
            {TONES.map((tone) => (
              <div key={tone} className={`flex items-center gap-2 rounded-inset px-3 py-2 text-[13px] ${TONE_CLASS[tone].wash}`}>
                <span className={`size-1.5 rounded-full ${TONE_CLASS[tone].dot}`} />
                {scene.states[tone]}
              </div>
            ))}
            <div className="space-y-2 pt-4">
              <h4 className="text-[12px] font-medium text-dim">System palette</h4>
              <PaletteStrip theme={theme.slug} values={theme.light && theme.dark ? { light: theme.light, dark: theme.dark } : undefined} />
            </div>
            <div className="space-y-2 pt-4">
              <h4 className="text-[12px] font-medium text-dim">Shape</h4>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Panel", value: theme.radius.panel, className: "rounded-panel" },
                  { label: "Inset", value: theme.radius.inset, className: "rounded-inset" },
                  { label: "Action", value: pill ? "pill" : theme.radius.inset, className: shape },
                ].map(({ label, value, className }) => (
                  <div key={label} className="min-w-0 space-y-1.5">
                    <div className={`h-12 ${inset} ${edge} ${className}`} />
                    <div className="flex items-baseline justify-between gap-2 text-[11px]">
                      <span className="text-dim">{label}</span>
                      <span className="text-faint tabular-nums">{value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className={`min-w-0 space-y-2 rounded-panel bg-card p-5 ${edge}`}>
            <h3 className="font-mono text-[10.5px] font-medium tracking-[0.09em] text-faint uppercase">Text types</h3>
            <p className="text-[12px] leading-5 text-dim">Select a type to highlight it in the card above. Select again to clear.</p>
            <div className="space-y-2">
              {specimens.map(({ role, label, className, font, sample }) => (
                <button
                  key={role}
                  type="button"
                  aria-pressed={selected === font.family}
                  aria-controls={recordId}
                  onClick={() => setSelected((current) => current === font.family ? null : font.family)}
                  className={`block min-h-11 w-full rounded-inset px-4 py-3.5 text-left text-ink transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lead ${selected === font.family ? "bg-lead-wash" : `${inset} hover:bg-lead-wash`}`}
                >
                  <span className="mb-2 flex flex-wrap justify-between gap-x-4 gap-y-1 text-[11px] text-dim">
                    <span className="inline-flex items-center gap-1.5">{label}{selected === font.family ? <span aria-hidden="true" className="size-1.5 rounded-full bg-lead" /> : null}</span><span>{font.family}</span>
                  </span>
                  <span style={{ fontFamily: font.css, fontWeight: role === "heading" ? weight : undefined }} className={className}>{sample}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
  );
}
