/**
 * The contract, enforced. Fails (exit 1) when:
 * - a theme is missing a contract token, in light or dark;
 * - globals.css does not map a contract token to a Tailwind colour;
 * - an item folder is not listed in registry/items/index.ts, or lists a file that does not exist;
 * - a shipped file names a colour directly (hex, rgb, a Tailwind palette colour, text-white).
 * Warns when a credit's licence is unknown: fine while private, a blocker for going public.
 */
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { TOKENS } from "../src/themes/contract.ts";
import { THEMES } from "../src/themes/index.ts";
import { ROOT, itemFolders, loadMetas } from "./registry-source.ts";

const errors: string[] = [];
const warnings: string[] = [];

for (const theme of THEMES) {
  for (const mode of ["light", "dark"] as const) {
    for (const { name } of TOKENS) {
      if (!theme[mode][name]) errors.push(`theme ${theme.slug}: ${mode} has no value for --${name}`);
    }
  }
}

const globals = await readFile(path.join(ROOT, "src/app/globals.css"), "utf8");
for (const { name } of TOKENS) {
  if (!globals.includes(`--color-${name}: var(--${name})`)) {
    errors.push(`globals.css: --color-${name} is not mapped in @theme inline`);
  }
}

const index = await readFile(path.join(ROOT, "registry/items/index.ts"), "utf8");
for (const folder of await itemFolders()) {
  if (!index.includes(`./${folder}/meta`)) errors.push(`registry/items/${folder} is not listed in registry/items/index.ts`);
}

const RAW_COLOUR = [
  { pattern: /#[0-9a-fA-F]{3,8}\b/, label: "hex colour" },
  { pattern: /\brgba?\(/, label: "rgb()" },
  { pattern: /\b(?:bg|text|border|ring|fill|stroke|from|via|to|outline|shadow|decoration|accent|caret)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/, label: "Tailwind palette colour" },
  { pattern: /\b(?:text|bg|border)-(?:white|black)\b/, label: "white/black (use a token)" },
];

for (const meta of await loadMetas()) {
  if (!meta.category) errors.push(`${meta.name}: has no category, so the sidebar has nowhere to list it`);
  for (const file of meta.files) {
    const full = path.join(ROOT, file);
    try {
      await access(full);
    } catch {
      errors.push(`${meta.name}: lists ${file}, which does not exist`);
      continue;
    }
    const source = await readFile(full, "utf8");
    source.split("\n").forEach((line, i) => {
      for (const { pattern, label } of RAW_COLOUR) {
        if (pattern.test(line)) errors.push(`${file}:${i + 1}: ${label}: ${line.trim().slice(0, 100)}`);
      }
    });
  }
  for (const credit of meta.credits) {
    if (!credit.license || credit.license === "unknown") {
      warnings.push(`${meta.name}: licence unknown for "${credit.name}" (list it in NOTICE)`);
    }
  }
}

for (const warning of warnings) console.warn(`warn  ${warning}`);
for (const error of errors) console.error(`error ${error}`);
if (errors.length > 0) process.exit(1);
console.log(`ok    ${THEMES.length} themes, ${TOKENS.length} tokens, every item listed and token-clean`);
