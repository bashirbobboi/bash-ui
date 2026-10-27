import type { ComponentType, ReactNode } from "react";

/**
 * How big a thing is. Decides where it sits in the gallery and how much
 * surrounding app it assumes.
 *
 * - primitive: one control (checkbox, tooltip, input). Knows nothing of data.
 * - widget: one self-contained visual (a gauge, a dial, a slider). Takes data as props.
 * - pattern: a composed section (a chart card with its legend and verdict, an inbox).
 */
export type ItemKind = "primitive" | "widget" | "pattern";

export type Credit = {
  name: string;
  url?: string;
  /** SPDX id when known (MIT, Apache-2.0). "unknown" blocks open-sourcing. */
  license?: string;
};

/**
 * What a thing is for, which is how the sidebar groups the gallery and how
 * /collections/<category> shows every member side by side.
 */
export type ItemCategory =
  | "buttons"
  | "navigation"
  | "inputs"
  | "charts"
  | "feedback"
  | "lists"
  | "overlays"
  | "data-display"
  | "media"
  | "text";

export type ItemMeta = {
  /** kebab-case; the install name: `npx shadcn add @bash/<name>`. */
  name: string;
  title: string;
  kind: ItemKind;
  category?: ItemCategory;
  /** Gallery charts that need the whole row rather than one grid column. */
  previewWidth?: "full";
  /** Motion that plays once on mount; the gallery offers a Replay button. */
  previewReplay?: boolean;
  /** Inline reveals, such as accordions, grow their surface and move following content down. */
  previewGrow?: boolean;
  /** shadcn item type. primitive → registry:ui, widget → registry:component, pattern → registry:block. */
  type: "registry:ui" | "registry:component" | "registry:block";
  /** One sentence: what it is. */
  description: string;
  /** One or two sentences: when to reach for it, and when not to. Read by agents. */
  whenToUse: string;
  /** Repo-relative paths of the files that ship. The first is the main file. */
  files: string[];
  /** npm packages the shipped files import. */
  dependencies?: string[];
  /** Other bash-ui items the shipped files import, by name. */
  registryDependencies?: string[];
  /** Where it was first built. */
  origin: { project: string; path: string };
  /** Who it was inspired by or adapted from. Empty means original work. */
  credits: Credit[];
  /** The props worth knowing, for the gallery and the AI index. */
  props: { name: string; type: string; description: string }[];
};

/**
 * One knob in the playground. `name` is the prop it sets, so the code panel
 * can print `<Component name={value} />` from the current values.
 */
export type PlaygroundControl =
  | {
      type: "select";
      name: string;
      label?: string;
      /** A value, or a value with the words shown on its pill (`{ value: "var(--go)", label: "Go" }`). */
      options: readonly (string | { value: string; label: string })[];
      default: string;
    }
  | { type: "boolean"; name: string; label?: string; default: boolean }
  | { type: "number"; name: string; label?: string; min: number; max: number; step?: number; default: number }
  | { type: "text"; name: string; label?: string; default: string };

export type PlaygroundValues = Record<string, string | number | boolean>;

export type PlaygroundSpec = {
  /** The export the code panel imports and renders, e.g. "SendButton". */
  component: string;
  /** Three to six of the props worth turning. */
  controls: PlaygroundControl[];
  /** The component with the current values applied; one instance, no surroundings. */
  render: (values: PlaygroundValues) => ReactNode;
  /**
   * Props the code panel should show that are not controls, written as JSX
   * attributes: `onSubmit={sendEmail}`, `data={series}`.
   */
  codeProps?: string[];
};

export type RegistryItem = {
  meta: ItemMeta;
  /** The component once, at rest, with nothing around it. Used for every gallery tile. */
  Preview: ComponentType;
  playground: PlaygroundSpec;
};
