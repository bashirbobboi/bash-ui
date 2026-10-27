import type { ItemMeta } from "@/registry/types";
import { TOKENS } from "@/themes/contract";
import type { Theme, ThemeFont } from "@/themes/types";
import { REGISTRY_CONFIG, REGISTRY_FALLBACK, SITE_URL, installCommand, themeItemName } from "./site";

/**
 * Who a prompt is written for, and what about them changes it:
 *
 * - `install`: "cli" agents run `npx shadcn add`; "paste" ones cannot reach
 *   the registry, so the source and the theme come in the prompt.
 * - `shell`: whether it can run npm itself.
 * - `stack`: the app it builds, which decides how fonts load. v0 builds
 *   Next.js; Lovable builds Vite or TanStack Start apps, so no next/font;
 *   "any" leaves it to the agent to look.
 * - `memory`: the file it rereads every session, where a design system's
 *   rules belong.
 * - `note`: something only this agent runs into.
 */
export type Agent = {
  id: string;
  name: string;
  install: "cli" | "paste";
  shell: boolean;
  stack: "any" | "next" | "web";
  memory?: string;
  note?: string;
};

export const AGENTS: Agent[] = [
  { id: "claude-code", name: "Claude Code", install: "cli", shell: true, stack: "any", memory: "CLAUDE.md" },
  {
    id: "codex",
    name: "Codex",
    install: "cli",
    shell: true,
    stack: "any",
    memory: "AGENTS.md",
    note: "The install downloads from the registry, and the Codex sandbox blocks network access by default. If it fails for that reason, ask me to allow network access rather than writing it by hand.",
  },
  { id: "cursor", name: "Cursor", install: "cli", shell: true, stack: "any", memory: ".cursor/rules/bash-ui.mdc" },
  { id: "replit", name: "Replit", install: "cli", shell: true, stack: "any", memory: "replit.md" },
  { id: "lovable", name: "Lovable", install: "paste", shell: false, stack: "web", memory: "AGENTS.md" },
  { id: "bolt", name: "Bolt.new", install: "paste", shell: true, stack: "any" },
  { id: "v0", name: "v0", install: "paste", shell: false, stack: "next" },
];

export function getAgent(id: string | undefined): Agent {
  return AGENTS.find((agent) => agent.id === id) ?? AGENTS[0];
}

/** A file as it lands in a consuming project, imports already pointed at `@/components`. */
export type ShippedFile = { path: string; content: string };

/** What the browser builders need pasted in: the item's files, its bash-ui dependencies' files, and npm packages. */
export type ItemSource = { files: ShippedFile[]; deps: ShippedFile[]; packages: string[] };

/** A fence longer than any run of backticks inside, so the code cannot close it early. */
function fence(content: string, lang: string): string {
  const longest = Math.max(2, ...(content.match(/`+/g) ?? []).map((run) => run.length));
  const ticks = "`".repeat(longest + 1);
  return `${ticks}${lang}\n${content.trimEnd()}\n${ticks}`;
}

function list(items: string[]): string {
  return items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}

/** Each face once, with what loading it outside next/font takes. */
function faces(theme: Theme) {
  const unique = [theme.fonts.body, theme.fonts.heading, theme.fonts.mono, theme.fonts.interface].filter(
    (font, index, all): font is ThemeFont => font !== undefined && all.findIndex((other) => other?.family === font.family) === index,
  );
  return unique.map((font) => ({
    ...font,
    /** The variable next/font would set, which the theme's font stacks read. */
    variable: font.css.match(/var\((--[\w-]+)\)/)?.[1],
    local: font.nextFont?.includes("next/font/local") ?? false,
    files: font.nextFont?.match(/https?:\/\/\S+\.woff2/g) ?? [],
  }));
}

/** How to load the theme's fonts, for the app the agent builds. */
function fontStep(theme: Theme, agent: Agent): string {
  // A face with no next/font call is a system font: nothing to load.
  const all = faces(theme).filter((font) => font.nextFont);
  if (all.length === 0) return "Its fonts are system fonts, so there is nothing to load.";
  const calls = fence(all.map((font) => font.nextFont).join("\n"), "tsx");
  const google = all.filter((font) => !font.local).map((font) => font.family);
  const local = all
    .filter((font) => font.local)
    .map((font) => ` ${font.family} is not on Google Fonts: add @font-face rules for ${font.files.join(", ")}.`)
    .join("");
  const variables = all.filter((font) => font.variable).map((font) => `${font.variable}: "${font.family}"`);
  const viaLink = `from Google Fonts with a <link> in the document head: ${list(google)}.${local}`;

  if (agent.stack === "next") return `Load the fonts in app/layout.tsx with next/font, adding each one's variable to the <html> className:\n${calls}`;
  if (agent.stack === "web") return `Load the fonts ${viaLink}`;
  return `Load the fonts. In a Next.js app, use next/font and add each one's variable to the <html> className:\n${calls}\nOtherwise load them ${viaLink} Then set ${list(variables)} on :root, since the theme reads those variables.`;
}

const TOKEN_RULE =
  "Use only the token utilities (bg-card, text-ink, text-dim, border-rule, text-lead, text-go/hold/stop, rounded-panel, rounded-inset, font-body…), never hex or Tailwind palette colours.";

/**
 * A theme as a consuming project's global stylesheet: the values for light
 * and dark, and the Tailwind v4 names that turn them into utilities. The same
 * thing `npx shadcn add @bash/theme-<slug>` writes. `fontVariables` also
 * names each face in the variable next/font would have set, for an app that
 * loads its fonts another way.
 */
export function themeCss(theme: Theme, { fontVariables = false } = {}): string {
  const values = (mode: "light" | "dark") => [
    ...TOKENS.map(({ name }) => `--${name}: ${theme[mode][name]};`),
    ...(mode === "light"
      ? [
          `--radius: ${theme.radius.panel};`,
          `--panel-radius: ${theme.radius.panel};`,
          `--inset-radius: ${theme.radius.inset};`,
          ...(fontVariables ? faces(theme).filter((font) => font.variable).map((font) => `${font.variable}: "${font.family}";`) : []),
          `--body-font: ${theme.fonts.body.css};`,
          `--heading-font: ${theme.fonts.heading.css};`,
          `--heading-weight: ${theme.scene.headingWeight ?? 600};`,
          `--code-font: ${theme.fonts.mono.css};`,
          `--interface-font: ${(theme.fonts.interface ?? theme.fonts.body).css};`,
        ]
      : []),
  ];
  const names = [
    ...TOKENS.map(({ name }) => `--color-${name}: var(--${name});`),
    "--radius-panel: var(--panel-radius);",
    "--radius-inset: var(--inset-radius);",
    "--font-body: var(--body-font);",
    "--font-heading: var(--heading-font);",
    "--font-mono: var(--code-font);",
    "--font-interface: var(--interface-font);",
  ];
  const block = (selector: string, lines: string[]) => `${selector} {\n${lines.map((line) => `  ${line}`).join("\n")}\n}`;
  return `${[block(":root", values("light")), block(".dark", values("dark")), block("@theme inline", names)].join("\n\n")}\n`;
}

/** Where the theme goes when it is pasted in, and what to do on Tailwind 3. */
function themeStep(theme: Theme, agent: Agent): string[] {
  const where = agent.stack === "next" ? "app/globals.css, below the Tailwind import" : "the global stylesheet";
  return [
    `Add the ${theme.name} theme to ${where}. If the project is still on Tailwind 3, keep :root and .dark and map the @theme names under theme.extend in tailwind.config instead.`,
    fence(themeCss(theme, { fontVariables: agent.stack === "web" }), "css"),
  ];
}

/** Telling the agent to keep a design system's rules where it rereads them. */
function saveRules(agent: Agent): string | null {
  if (!agent.memory) return null;
  if (agent.memory.endsWith(".mdc")) {
    return `Save the rules below as ${agent.memory}, a Cursor rule that starts with this frontmatter so it applies to every chat:\n---\ndescription: bash-ui design system rules\nalwaysApply: true\n---`;
  }
  return `Save the rules below to ${agent.memory} so every later session keeps to them.`;
}

/** "Copy code": the item's own files, each under the path it lands at. */
export function componentCode(source: ItemSource): string {
  if (source.files.length === 1) return source.files[0].content;
  return source.files.map((file) => `// ${file.path}\n${file.content.trimEnd()}`).join("\n\n");
}

/**
 * "Copy prompt" on a component: enough for an agent to add it and use it,
 * in the way that agent can. `theme` is the design system it was last shown
 * in, offered for a project that has none yet.
 */
export function componentPrompt(meta: ItemMeta, agent: Agent, theme: Theme, source: ItemSource): string {
  const about = [
    `What it is: ${meta.description}`,
    `When to use it: ${meta.whenToUse}`,
    ...(meta.props.length > 0
      ? ["", "Props:", ...meta.props.map((prop) => `- ${prop.name}: ${prop.type} — ${prop.description}`)]
      : []),
    ...(agent.memory ? ["", `If ${agent.memory} has bash-ui design system rules, follow them where you use it.`] : []),
  ];

  if (agent.install === "cli") {
    return [
      `Add the "${meta.title}" component from my bash-ui registry to this project.`,
      "",
      `Run: ${installCommand(meta.name)}`,
      REGISTRY_FALLBACK,
      REGISTRY_CONFIG,
      ...(agent.note ? ["", agent.note] : []),
      "",
      ...about,
      "",
      `It reads colours, corners and fonts from the bash-ui token contract. If the project has no bash-ui theme yet, install ${theme.name}: ${installCommand(themeItemName(theme.slug))}`,
      fontStep(theme, agent),
      `The other design systems are listed at ${SITE_URL}/llms.txt.`,
    ].join("\n");
  }

  const files = [...source.files, ...source.deps];
  const usesCn = files.some((file) => file.content.includes("@/lib/utils"));
  const packages = source.packages.length === 0 ? [] : [agent.shell ? `Run: npm install ${source.packages.join(" ")}` : `Add these npm packages: ${list(source.packages)}.`];
  return [
    `Add the "${meta.title}" component to this project. It comes from my bash-ui library: create ${files.length === 1 ? "the file" : "the files"} below exactly as written.`,
    "",
    ...about,
    "",
    ...packages,
    ...(usesCn ? ['It imports `cn` from "@/lib/utils", the usual clsx + tailwind-merge helper; add it if the project has none.'] : []),
    ...(packages.length > 0 || usesCn ? [""] : []),
    ...files.flatMap((file) => [file.path, fence(file.content, "tsx"), ""]),
    "Colours, corners and fonts come from CSS variables (bg-card, text-ink, rounded-panel, font-body…). If the project doesn't define them yet:",
    ...themeStep(theme, agent),
    fontStep(theme, agent),
  ].join("\n");
}

/** "Copy prompt" on a design system page: set a project up in that system and keep to its rules. */
/**
 * A playground mix. It is not in the registry, so its CSS always travels in
 * the prompt, whatever the agent; the components picked into it install by
 * name from the registry.
 */
export function mixPrompt(theme: Theme, agent: Agent, parts: string[]): string {
  const save = saveRules(agent);
  const [themeLine, css] = themeStep(theme, agent);
  const steps = [
    `${themeLine}\n${css}`,
    fontStep(theme, agent),
    ...(parts.length
      ? [`Add the components I picked: ${installCommand(...parts)}\n${REGISTRY_FALLBACK}\n${REGISTRY_CONFIG}`]
      : []),
    ...(save ? [save] : []),
  ];
  return [
    `Set this project up in "${theme.name}", a design system I mixed in the bash-ui playground.`,
    "",
    ...steps.map((step, i) => `${i + 1}. ${step}`),
    "",
    "Follow this rule for every screen you build:",
    `- ${TOKEN_RULE} The full contract and the components that fit it are listed at ${SITE_URL}/llms.txt.`,
  ].join("\n");
}

export function systemPrompt(theme: Theme, agent: Agent): string {
  const save = saveRules(agent);
  const body = [
    `What it is: ${theme.summary}`,
    "",
    "Follow these rules for every screen you build:",
    ...theme.rules.map((rule) => `- ${rule.title}. ${rule.body}`),
    "",
    `${TOKEN_RULE} The full contract and the components that fit it are listed at ${SITE_URL}/llms.txt.`,
  ];

  if (agent.install === "cli") {
    return [
      `Set this project up in the "${theme.name}" design system from my bash-ui registry (made for ${theme.project}).`,
      "",
      `1. Run: ${installCommand(themeItemName(theme.slug))}`,
      `2. ${fontStep(theme, agent)}`,
      ...(save ? [`3. ${save}`] : []),
      "",
      REGISTRY_FALLBACK,
      REGISTRY_CONFIG,
      ...(agent.note ? ["", agent.note] : []),
      "",
      ...body,
    ].join("\n");
  }

  const [themeLine, css] = themeStep(theme, agent);
  return [
    `Set this project up in the "${theme.name}" design system from my bash-ui library (made for ${theme.project}).`,
    "",
    `1. ${themeLine}`,
    css,
    `2. ${fontStep(theme, agent)}`,
    ...(save ? [`3. ${save}`] : []),
    "",
    ...body,
  ].join("\n");
}
