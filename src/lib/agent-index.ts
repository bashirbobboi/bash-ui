import { ITEMS } from "@/registry/items";
import { THEMES } from "@/themes";
import { TOKENS } from "@/themes/contract";
import { NAMESPACE, REGISTRY_CONFIG, REGISTRY_FALLBACK, SITE_URL, installCommand, themeItemName } from "./site";

/**
 * The index an agent reads before starting a project: which design systems
 * exist, what each insists on, and which components to reach for. Plain text,
 * served at /llms.txt, so any agent can fetch it without a parser.
 */
export function agentIndex(): string {
  const lines: string[] = [
    "# bash-ui",
    "",
    "> Bashir's design systems and components, as a shadcn registry. Every component is written against one token contract, so it renders in any of the design systems below.",
    "",
    "## How to use this",
    "",
    "1. Pick a design system below, or ask the person which project's look they want.",
    `2. Install the theme: \`${installCommand(themeItemName("<slug>"))}\`, then load its fonts with next/font.`,
    `3. Install components as needed: \`${installCommand("<name>")}\`.`,
    "4. Follow the system's rules when composing new screens. Use only contract tokens (below) for colour, never hex or Tailwind palette colours.",
    "",
    REGISTRY_FALLBACK,
    "",
    "```json",
    REGISTRY_CONFIG,
    "```",
    "",
    `Every item's JSON (source included) is at ${SITE_URL}/r/<name>.json; the full list is ${SITE_URL}/r/registry.json.`,
    "",
    "## Design systems",
    "",
  ];

  for (const theme of THEMES) {
    lines.push(
      `### ${theme.name} (${theme.project}) — \`${NAMESPACE}/${themeItemName(theme.slug)}\``,
      "",
      theme.summary,
      "",
      `Fonts: body ${theme.fonts.body.family}, headings ${theme.fonts.heading.family}, mono ${theme.fonts.mono.family}${theme.fonts.interface ? `, interface ${theme.fonts.interface.family}` : ""}. Radius: panel ${theme.radius.panel}, inset ${theme.radius.inset}.`,
      "",
      "Rules:",
      ...theme.rules.map((rule) => `- **${rule.title}.** ${rule.body}`),
      "",
      `Page: ${SITE_URL}/systems/${theme.slug}`,
      "",
    );
  }

  lines.push(
    "## Token contract",
    "",
    "Utilities are `bg-<token>`, `text-<token>`, `border-<token>`, plus `rounded-panel`, `rounded-inset`, `font-body`, `font-heading`, `font-mono`.",
    "",
    ...TOKENS.map((token) => `- \`${token.name}\` (${token.group}): ${token.role}`),
    "",
    "## Components",
    "",
  );

  for (const { meta } of ITEMS) {
    lines.push(
      `### ${meta.title} — \`${NAMESPACE}/${meta.name}\` (${meta.category ?? meta.kind})`,
      "",
      meta.description,
      "",
      `When to use: ${meta.whenToUse}`,
      "",
      ...(meta.props.length > 0
        ? ["Props:", ...meta.props.map((prop) => `- \`${prop.name}: ${prop.type}\` — ${prop.description}`), ""]
        : []),
      `Install: \`${installCommand(meta.name)}\` · Page: ${SITE_URL}/components/${meta.name}`,
      "",
    );
  }

  return lines.join("\n");
}
