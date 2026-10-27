import { themeContrast } from "@/lib/contrast";
import type { Theme } from "@/themes/types";
import { PanelGroup } from "./detail";

export function ThemeAccessibility({ theme }: { theme: Theme }) {
  return (
    <PanelGroup title="Accessibility">
      <div className="space-y-4 rounded-xl bg-card p-4">
        <div className="space-y-1">
          <h3 className="text-[14px] font-medium text-ink">WCAG 2.2 colour contrast</h3>
          <p className="text-[13px] leading-5 text-dim">Calculated from this system’s colours in both modes. These are contrast checks, not an overall accessibility score or certification.</p>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {(["light", "dark"] as const).map((mode) => {
            const checks = themeContrast(theme[mode]);
            const passing = checks.filter((check) => check.passes).length;
            return (
              <details key={mode} className="rounded-inset border border-rule p-3">
                <summary className="cursor-pointer text-[13px] font-medium text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
                  {mode === "light" ? "Light" : "Dark"} · {passing}/{checks.length} pairs meet AA
                </summary>
                <p className="mt-3 text-[12px] leading-5 text-dim">Text pairs use the normal-size AA threshold; focus-ring pairs use the non-text threshold.</p>
                <ul className="mt-2 divide-y divide-rule-soft">
                  {checks.map((check) => (
                    <li key={check.label} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-[12px]">
                      <span className="flex items-center gap-2 text-ink">
                        <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-inset font-bold" style={{ color: check.foregroundColour, backgroundColor: check.backgroundColour }}>Aa</span>
                        {check.label}
                      </span>
                      <span className="text-dim"><span className="font-mono tabular-nums">{(Math.floor(check.ratio * 100) / 100).toFixed(2)}:1</span> · {check.result}</span>
                    </li>
                  ))}
                </ul>
              </details>
            );
          })}
        </div>
        <p className="text-[12px] leading-5 text-dim">Normal text: AA ≥ 4.5:1, AAA ≥ 7:1. Large text: AA ≥ 3:1, AAA ≥ 4.5:1 (24px regular or approximately 18.67px bold). Non-text indicators: AA ≥ 3:1. Ratios are displayed rounded down; results use full precision.</p>
        <p className="flex flex-wrap gap-x-4 gap-y-2 text-[12px] text-lead">
          <a className="underline underline-offset-2" href="https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html">AA text guidance</a>
          <a className="underline underline-offset-2" href="https://www.w3.org/WAI/WCAG22/Understanding/contrast-enhanced.html">AAA text guidance</a>
          <a className="underline underline-offset-2" href="https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html">Non-text contrast guidance</a>
        </p>
      </div>
    </PanelGroup>
  );
}
