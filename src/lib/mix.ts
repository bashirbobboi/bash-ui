import { THEMES, getTheme } from "../themes/index.ts";
import { TOKENS, type TokenName, type TokenValues } from "../themes/contract.ts";
import type { Theme, ThemeFont, ThemeScene } from "../themes/types.ts";

/**
 * The playground's model: a design system mixed from the others. One system
 * supplies the sample content, one the palette, any loaded face each text
 * role, and a handful of key colours can be repainted per mode. Everything
 * else in the contract follows from those, so ~10 choices still fill all of it.
 */

export const MIX_SLUG = "mix";

/** The colours the playground exposes. The rest of the contract is derived or kept. */
export const KEY_COLOURS = [
  { token: "ground", label: "Page" },
  { token: "card", label: "Card" },
  { token: "paper", label: "Inset" },
  { token: "ink", label: "Primary text" },
  { token: "dim", label: "Secondary text" },
  { token: "lead", label: "Accent" },
  { token: "brand", label: "Brand" },
  { token: "go", label: "Positive" },
  { token: "hold", label: "Waiting" },
  { token: "stop", label: "Negative" },
] as const satisfies readonly { token: TokenName; label: string }[];

export type KeyColour = (typeof KEY_COLOURS)[number]["token"];
type Overrides = Partial<Record<KeyColour, string>>;

export type Mix = {
  name: string;
  /** Everything not chosen below, and the look of the sample: edges, fills, insets. */
  base: string;
  /** Where every colour not repainted below comes from. */
  colours: string;
  heading: string;
  /** What was asked for; the heading face shows the nearest weight it has (`nearestWeight`). */
  headingWeight: number;
  body: string;
  mono: string;
  panel: number;
  inset: number;
  pill: boolean;
  light: Overrides;
  dark: Overrides;
  /** Registry items picked to try in the mix, by name; the install command lists them. */
  parts: string[];
};

/**
 * The sample the playground shows, the same whichever system a mix starts
 * from, so switching systems changes how it looks and never what it says.
 * The base system still decides the look: hairline or surface panels, the
 * primary fill, outline or tonal secondary, paper or muted insets.
 */
const MIX_SCENE = {
  eyebrow: { text: "Project · PRJ-0318", font: "mono" },
  status: { tone: "hold", label: "In review" },
  title: "Spring launch",
  blurb: "A new home page, pricing and onboarding, going live with the March release. Two sign-offs left before it ships.",
  stats: [
    { label: "Tasks", value: "128" },
    { label: "Done", value: "104" },
    { label: "Blocked", value: "2" },
  ],
  actions: { primary: "Approve", secondary: "Request changes", link: "View brief" },
  footnote: { text: "Updated 2 hours ago · 6 people on this project", font: "body" },
  states: { go: "104 tasks done", hold: "Waiting on 2 sign-offs", stop: "2 tasks blocked" },
  samples: {
    heading: "Spring launch",
    body: "Every page, price and email checked before it ships.",
    mono: "PRJ-0318 · 2026-03-31",
  },
} satisfies Omit<ThemeScene, "actions" | "panel"> & { actions: Pick<ThemeScene["actions"], "primary" | "secondary" | "link"> };

/** Every face the showcase already loads, once each, in system order. */
export const FONTS: ThemeFont[] = THEMES.flatMap((theme) => Object.values(theme.fonts)).filter(
  (font, index, all) => all.findIndex((other) => other.family === font.family) === index,
);

/** The heading weights the playground offers. */
export const HEADING_WEIGHTS = [300, 400, 500, 600, 700] as const;

/**
 * Of those, the weights each face has loaded (src/app/layout.tsx). Variable
 * faces not listed have all five. A weight a face lacks would be faked by the
 * browser, so it is never offered.
 */
const FONT_WEIGHTS: Record<string, readonly number[]> = {
  Lato: [300, 400, 700],
  Lora: [400, 500, 600, 700],
  "Playfair Display": [400, 500, 600, 700],
  Orbitron: [400, 500, 600, 700],
  "Open Runde": [400, 500, 600, 700],
  "Instrument Serif": [400],
  "Viaoda Libre": [400],
  "System monospace": [400, 700],
};

export function fontWeights(family: string): readonly number[] {
  return FONT_WEIGHTS[family] ?? HEADING_WEIGHTS;
}

/** The weight a face actually has that is closest to the one asked for. */
export function nearestWeight(family: string, wanted: number): number {
  return fontWeights(family).reduce((best, weight) => (Math.abs(weight - wanted) < Math.abs(best - wanted) ? weight : best));
}

export const RADIUS_MAX = 28;
const HEX = /^#[0-9a-f]{6}$/i;
const ITEM_NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const PARTS_MAX = 24;
const KEYS = KEY_COLOURS.map(({ token }) => token);

export function mixFrom(slug: string, name = ""): Mix {
  const theme = getTheme(slug) ?? THEMES[0];
  return {
    name,
    base: theme.slug,
    colours: theme.slug,
    heading: theme.fonts.heading.family,
    headingWeight: theme.scene.headingWeight ?? 600,
    body: theme.fonts.body.family,
    mono: theme.fonts.mono.family,
    panel: parseInt(theme.radius.panel, 10),
    inset: parseInt(theme.radius.inset, 10),
    pill: theme.scene.actions.shape === "pill",
    light: {},
    dark: {},
    parts: [],
  };
}

/** `t` of the way from `from` to `to`, in sRGB. Both six-digit hex. */
function blend(from: string, to: string, t: number): string {
  const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  return `#${[0, 1, 2]
    .map((i) => Math.round(channel(from, i) + (channel(to, i) - channel(from, i)) * t).toString(16).padStart(2, "0"))
    .join("")}`;
}

/** Tokens that follow a key colour, recomputed only when one of their sources is repainted. */
const DERIVED: { token: TokenName; from: KeyColour[]; value: (c: Record<KeyColour, string>) => string }[] = [
  { token: "background", from: ["ground"], value: (c) => c.ground },
  { token: "popover", from: ["card"], value: (c) => c.card },
  { token: "muted", from: ["card", "ink"], value: (c) => blend(c.card, c.ink, 0.05) },
  { token: "paper-sunk", from: ["paper", "ink"], value: (c) => blend(c.paper, c.ink, 0.05) },
  { token: "rule", from: ["card", "ink"], value: (c) => blend(c.card, c.ink, 0.14) },
  { token: "rule-soft", from: ["card", "ink"], value: (c) => blend(c.card, c.ink, 0.07) },
  { token: "border", from: ["card", "ink"], value: (c) => blend(c.card, c.ink, 0.14) },
  { token: "input", from: ["card", "ink"], value: (c) => blend(c.card, c.ink, 0.14) },
  { token: "foreground", from: ["ink"], value: (c) => c.ink },
  { token: "card-foreground", from: ["ink"], value: (c) => c.ink },
  { token: "popover-foreground", from: ["ink"], value: (c) => c.ink },
  { token: "on-solid", from: ["ink", "card"], value: (c) => c.card },
  { token: "muted-foreground", from: ["dim"], value: (c) => c.dim },
  { token: "faint", from: ["dim", "card"], value: (c) => blend(c.dim, c.card, 0.35) },
  { token: "lead-mid", from: ["lead", "ink"], value: (c) => blend(c.lead, c.ink, 0.15) },
  { token: "lead-wash", from: ["lead", "card"], value: (c) => blend(c.card, c.lead, 0.14) },
  { token: "ring", from: ["lead"], value: (c) => c.lead },
  { token: "brand-hover", from: ["brand", "ink"], value: (c) => blend(c.brand, c.ink, 0.15) },
  { token: "go-wash", from: ["go", "card"], value: (c) => blend(c.card, c.go, 0.16) },
  { token: "hold-wash", from: ["hold", "card"], value: (c) => blend(c.card, c.hold, 0.16) },
  { token: "stop-wash", from: ["stop", "card"], value: (c) => blend(c.card, c.stop, 0.16) },
];

function paint(values: TokenValues, overrides: Overrides): TokenValues {
  const out = { ...values };
  // A token that was the same colour as a repainted key was standing in for it
  // (Neutral's primary is its ink), so it follows. Keys never follow each other.
  for (const [key, hex] of Object.entries(overrides)) {
    const was = values[key as KeyColour].toLowerCase();
    for (const { name } of TOKENS) {
      if (!(KEYS as string[]).includes(name) && values[name].toLowerCase() === was) out[name] = hex;
    }
  }
  Object.assign(out, overrides);
  const keys = Object.fromEntries(KEYS.map((key) => [key, out[key]])) as Record<KeyColour, string>;
  const touched = new Set(Object.keys(overrides));
  for (const rule of DERIVED) {
    if (rule.from.some((key) => touched.has(key))) out[rule.token] = rule.value(keys);
  }
  return out;
}

function face(family: string, fallback: ThemeFont): ThemeFont {
  return FONTS.find((font) => font.family === family) ?? fallback;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "untitled";
}

export function mixTheme(mix: Mix): Theme {
  const base = getTheme(mix.base) ?? THEMES[0];
  const palette = getTheme(mix.colours) ?? base;
  const sources = [...new Set([base.name, palette.name])].join(" and ");
  return {
    slug: MIX_SLUG,
    name: mix.name.trim() || "Untitled",
    palettePreview: palette.palettePreview,
    project: "Playground",
    summary: `Mixed in the playground from ${sources}.`,
    rules: [],
    fonts: {
      heading: face(mix.heading, base.fonts.heading),
      body: face(mix.body, base.fonts.body),
      mono: face(mix.mono, base.fonts.mono),
    },
    radius: { panel: `${mix.panel}px`, inset: `${mix.inset}px` },
    scene: {
      ...MIX_SCENE,
      headingWeight: nearestWeight(mix.heading, mix.headingWeight),
      panel: base.scene.panel,
      inset: base.scene.inset,
      actions: { ...MIX_SCENE.actions, fill: base.scene.actions.fill, quiet: base.scene.actions.quiet, shape: mix.pill ? "pill" : "inset" },
    },
    light: paint(palette.light, mix.light),
    dark: paint(palette.dark, mix.dark),
  };
}

function encodeOverrides(overrides: Overrides): string {
  return Object.entries(overrides).map(([key, hex]) => `${key}-${hex.slice(1)}`).join(".");
}

function decodeOverrides(value: string | null): Overrides {
  const out: Overrides = {};
  for (const pair of value?.split(".") ?? []) {
    const [key, hex] = pair.split("-");
    if ((KEYS as string[]).includes(key) && HEX.test(`#${hex}`)) out[key as KeyColour] = `#${hex.toLowerCase()}`;
  }
  return out;
}

export function mixParams(mix: Mix): string {
  const params = new URLSearchParams({
    base: mix.base,
    colours: mix.colours,
    heading: mix.heading,
    weight: String(mix.headingWeight),
    body: mix.body,
    mono: mix.mono,
    panel: String(mix.panel),
    inset: String(mix.inset),
    pill: mix.pill ? "1" : "0",
  });
  if (mix.name.trim()) params.set("name", mix.name.trim());
  if (Object.keys(mix.light).length) params.set("light", encodeOverrides(mix.light));
  if (Object.keys(mix.dark).length) params.set("dark", encodeOverrides(mix.dark));
  if (mix.parts.length) params.set("parts", mix.parts.join("."));
  return params.toString();
}

/**
 * Reads a playground link. Anything missing or unrecognised falls back to the
 * base system. Picked parts only have to look like item names here; the page
 * drops any the registry does not have.
 */
export function parseMix(params: URLSearchParams): Mix {
  const system = (slug: string | null) => (slug && getTheme(slug) ? slug : null);
  const start = mixFrom(system(params.get("base")) ?? "neutral", params.get("name") ?? "");
  const family = (value: string | null) => (value && FONTS.some((font) => font.family === value) ? value : null);
  const radius = (value: string | null) => {
    const n = Number(value);
    return value !== null && Number.isInteger(n) && n >= 0 && n <= RADIUS_MAX ? n : null;
  };
  return {
    ...start,
    colours: system(params.get("colours")) ?? start.colours,
    heading: family(params.get("heading")) ?? start.heading,
    headingWeight: HEADING_WEIGHTS.find((weight) => String(weight) === params.get("weight")) ?? start.headingWeight,
    body: family(params.get("body")) ?? start.body,
    mono: family(params.get("mono")) ?? start.mono,
    panel: radius(params.get("panel")) ?? start.panel,
    inset: radius(params.get("inset")) ?? start.inset,
    pill: params.has("pill") ? params.get("pill") === "1" : start.pill,
    light: decodeOverrides(params.get("light")),
    dark: decodeOverrides(params.get("dark")),
    parts: [...new Set(params.get("parts")?.split(".").filter((name) => ITEM_NAME.test(name)))].slice(0, PARTS_MAX),
  };
}

function variables(theme: Theme, mode: "light" | "dark", indent: string): string {
  const lines = TOKENS.map(({ name }) => `--${name}: ${theme[mode][name]};`);
  if (mode === "light") {
    lines.push(
      `--panel-radius: ${theme.radius.panel};`,
      `--inset-radius: ${theme.radius.inset};`,
      `--radius: ${theme.radius.panel};`,
      `--body-font: ${theme.fonts.body.css};`,
      `--heading-font: ${theme.fonts.heading.css};`,
      `--heading-weight: ${theme.scene.headingWeight ?? 600};`,
      `--code-font: ${theme.fonts.mono.css};`,
    );
  }
  return lines.map((line) => `${indent}${line}`).join("\n");
}

/** The mix as a consuming project's globals: `:root` for light, `.dark` for dark. */
export function mixCss(theme: Theme): string {
  return `:root {\n${variables(theme, "light", "  ")}\n}\n\n.dark {\n${variables(theme, "dark", "  ")}\n}\n`;
}

/** The mix as a `src/themes/<slug>.ts` to finish by hand: intent and rules are left to write. */
export function mixThemeFile(theme: Theme, mix: Mix): string {
  const slug = slugify(theme.name);
  const ident = slug.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase()).replace(/^(\d)/, "theme$1");
  const body = JSON.stringify({ ...theme, slug, project: "TODO" }, null, 2).replace(/^(\s*)"([A-Za-z_$][\w$]*)":/gm, "$1$2:");
  const sources = [...new Set([mix.base, mix.colours])].join(", ");
  return [
    `import type { Theme } from "./types.ts";`,
    "",
    "/**",
    ` * Mixed in the bash-ui playground (from ${sources}).`,
    " * Before listing it in THEMES: name the project, write the intent and the",
    " * rules, rewrite the scene in the project's own domain, and carry over the",
    " * credits of any system whose fonts or colours it borrows.",
    " */",
    `export const ${ident}: Theme = ${body};`,
    "",
  ].join("\n");
}
