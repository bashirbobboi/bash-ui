import type { Credit } from "../../registry/types.ts";
import type { TokenName, TokenValues } from "./contract.ts";

export type ThemeFont = {
  /** The family as a person would name it. */
  family: string;
  /** How to load it in a Next.js project, for the theme's install notes. */
  nextFont?: string;
  /** The CSS value the theme sets, e.g. `var(--font-lato), sans-serif`. */
  css: string;
};

export type ThemeRule = {
  title: string;
  body: string;
};

export type ThemeFontRole = keyof Theme["fonts"];

export type ThemeTone = "go" | "hold" | "stop";

/**
 * The sample record on a system's overview, written in the project's own
 * domain so the tokens are seen doing that project's job.
 */
export type ThemeScene = {
  /** A code or label above the title, set uppercase, small and tracked. */
  eyebrow?: { text: string; font: ThemeFontRole };
  status: { tone: ThemeTone; label: string };
  title: string;
  /** A phrase inside the title to set in italic. */
  emphasis?: string;
  /** The weight the heading face is set in. Defaults to 600. */
  headingWeight?: number;
  blurb: string;
  /** A section heading in the serif face; shown only when the theme has one. */
  section?: string;
  /** Three figures. Values default to the mono face. */
  stats: { label: string; value: string; font?: ThemeFontRole }[];
  actions: {
    primary: string;
    secondary: string;
    link: string;
    shape: "pill" | "inset";
    /** The primary action's fill. */
    fill: "ink" | "primary" | "lead";
    /** The secondary action: a hairline outline or a quiet tonal fill. */
    quiet: "outline" | "tonal";
    /** The face for button labels. Defaults to body. */
    font?: ThemeFontRole;
  };
  /** A small closing line, such as an admin status or a reference. */
  footnote?: { text: string; font: ThemeFontRole };
  /** Whether panels are edged with a hairline or stand on their surface alone. */
  panel: "hairline" | "surface";
  /**
   * The fill of the small boxes inside the panels (figures, shape samples,
   * text types). Defaults to paper; "muted" for a system whose paper is an
   * accent rather than its everyday inset.
   */
  inset?: "paper" | "muted";
  states: Record<ThemeTone, string>;
  /** The line each text type is shown with. */
  samples: Partial<Record<ThemeFontRole, string>> & { heading: string; body: string; mono: string };
};

export type Theme = {
  slug: string;
  name: string;
  /** Four representative source colours for the sidebar identity, not generic state colours. */
  palettePreview: readonly [TokenName, TokenName, TokenName, TokenName];
  /** The project this design system was made for. */
  project: string;
  /** Where the project lives, if it is public. */
  projectUrl?: string;
  /** Local screenshot of the consuming project’s landing page. */
  projectPreview?: string;
  /** One sentence: what it feels like and why. */
  summary: string;
  /** The audience, personality and choices behind the visual language. */
  intent?: string[];
  /** Whose work it was adapted from, if anyone's. */
  credits?: Credit[];
  /** The rules that make it this system and not another. */
  rules: ThemeRule[];
  fonts: {
    body: ThemeFont;
    heading: ThemeFont;
    mono: ThemeFont;
    /** Optional editorial headings, such as numbered financial sections. */
    serif?: ThemeFont;
    /** Optional face for the project's internal tools, such as an admin dashboard. */
    interface?: ThemeFont;
  };
  radius: {
    /** Cards and panels. */
    panel: string;
    /** Controls and chips inside a card. */
    inset: string;
  };
  scene: ThemeScene;
  light: TokenValues;
  dark: TokenValues;
};
