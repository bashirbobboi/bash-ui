import { connect180 } from "./180connect.ts";
import { TOKENS } from "./contract.ts";
import { ledge } from "./ledge.ts";
import { neutral } from "./neutral.ts";
import { portfolio } from "./portfolio.ts";
import { steeze } from "./steeze.ts";
import { studio } from "./studio.ts";
import type { Theme } from "./types.ts";

/** Every design system, project themes first. The showcase lists them in this order. */
export const THEMES: Theme[] = [connect180, ledge, portfolio, steeze, studio, neutral];

/** The site's own chrome renders in this system. */
export const SITE_THEME = studio.slug;

export function getTheme(slug: string): Theme | undefined {
  return THEMES.find((theme) => theme.slug === slug);
}

function declarations(theme: Theme, mode: "light" | "dark"): string {
  const values = theme[mode];
  const lines = TOKENS.map(({ name }) => `--${name}:${values[name]};`);
  if (mode === "light") {
    lines.push(
      `--panel-radius:${theme.radius.panel};`,
      `--inset-radius:${theme.radius.inset};`,
      `--radius:${theme.radius.panel};`,
      `--body-font:${theme.fonts.body.css};`,
      `--heading-font:${theme.fonts.heading.css};`,
      `--heading-weight:${theme.scene.headingWeight ?? 600};`,
      `--code-font:${theme.fonts.mono.css};`,
      `--interface-font:${(theme.fonts.interface ?? theme.fonts.body).css};`,
    );
  }
  return lines.join("");
}

/**
 * The CSS that scopes a theme to `[data-theme="<slug>"]`, in light and in dark.
 * The showcase renders several themes on one page, so a theme never writes to
 * `:root`; a consuming project gets `:root` / `.dark` from the registry instead.
 * A `.dark` element inside a themed area is a dark island, as `.dark` is in a
 * consuming project, so a component can stay dark on a light page. A
 * `[data-mode="light"]` element is the reverse, a light island on a dark page,
 * so a preview can show either mode whatever the site is in.
 */
export function scopedThemeCss(theme: Theme): string {
  const sel = `[data-theme="${theme.slug}"]`;
  return [
    `${sel}{${declarations(theme, "light")}}`,
    // Islands: a themed area nested in another (a tile inside the site's own
    // theme) gains specificity from the extra [data-theme], so the nearest wins.
    `.dark ${sel},${sel}.dark,${sel} .dark,[data-theme] ${sel}.dark,[data-theme] ${sel} .dark{${declarations(theme, "dark")}}`,
    // Same specificity as `.dark ${sel}` and later, so it wins inside a dark page.
    `[data-mode="light"] ${sel}{${declarations(theme, "light")}}`,
  ].join("\n");
}
