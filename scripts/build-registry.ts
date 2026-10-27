/**
 * Writes registry.json from the themes and item metas, so neither has to be
 * kept in step by hand. `shadcn build` then turns it into public/r/*.json.
 *
 *   node scripts/build-registry.ts && npx shadcn build
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { SITE_URL, themeItemName } from "../src/lib/site.ts";
import { TOKENS } from "../src/themes/contract.ts";
import { THEMES } from "../src/themes/index.ts";
import type { Theme } from "../src/themes/types.ts";
import { ROOT, loadMetas } from "./registry-source.ts";

function themeItem(theme: Theme) {
  const light: Record<string, string> = {};
  const dark: Record<string, string> = {};
  const mapping: Record<string, string> = {};
  for (const { name } of TOKENS) {
    light[name] = theme.light[name];
    dark[name] = theme.dark[name];
    mapping[`color-${name}`] = `var(--${name})`;
  }
  Object.assign(light, {
    radius: theme.radius.panel,
    "panel-radius": theme.radius.panel,
    "inset-radius": theme.radius.inset,
    "body-font": theme.fonts.body.css,
    "heading-font": theme.fonts.heading.css,
    "heading-weight": String(theme.scene.headingWeight ?? 600),
    "code-font": theme.fonts.mono.css,
    "interface-font": (theme.fonts.interface ?? theme.fonts.body).css,
  });
  Object.assign(mapping, {
    "radius-panel": "var(--panel-radius)",
    "radius-inset": "var(--inset-radius)",
    "font-body": "var(--body-font)",
    "font-heading": "var(--heading-font)",
    "font-mono": "var(--code-font)",
    "font-interface": "var(--interface-font)",
  });

  const fonts = [...new Set([theme.fonts.body, theme.fonts.heading, theme.fonts.mono, theme.fonts.interface].map((f) => f?.nextFont))]
    .filter(Boolean)
    .join("; ");

  return {
    name: themeItemName(theme.slug),
    type: "registry:theme",
    title: `${theme.name} (${theme.project})`,
    description: theme.summary,
    cssVars: { theme: mapping, light, dark },
    docs: `Load the fonts with next/font: ${fonts}. Rules: ${SITE_URL}/systems/${theme.slug}`,
    meta: { project: theme.project, rules: theme.rules },
  };
}

const metas = await loadMetas();

const registry = {
  $schema: "https://ui.shadcn.com/schema/registry.json",
  name: "bash",
  homepage: SITE_URL,
  items: [
    ...THEMES.map(themeItem),
    ...metas.map((meta) => ({
      name: meta.name,
      type: meta.type,
      title: meta.title,
      description: meta.description,
      dependencies: meta.dependencies ?? [],
      registryDependencies: (meta.registryDependencies ?? []).map((name) => `${SITE_URL}/r/${name}.json`),
      files: meta.files.map((file) => ({ path: file, type: meta.type })),
      meta: { kind: meta.kind, whenToUse: meta.whenToUse, origin: meta.origin, credits: meta.credits },
    })),
  ],
};

await writeFile(path.join(ROOT, "registry.json"), `${JSON.stringify(registry, null, 2)}\n`);
console.log(`registry.json: ${THEMES.length} themes, ${metas.length} components`);
