import type { ReactNode } from "react";

/**
 * What the playground's views share: the steps, the views themselves, and the
 * registry items they preview. Kept apart from the components so none of them
 * import each other.
 */

export const STEP_IDS = ["start", "text", "colour", "shape", "components", "review"] as const;
export type Step = (typeof STEP_IDS)[number];

export const STEPS: { id: Step; label: string; title: string; hint: string; optional?: boolean }[] = [
  {
    id: "start",
    label: "Start",
    title: "Name it and pick a starting point",
    hint: "Anything you leave alone comes from the system you start from, so pick the one closest to what you have in mind.",
  },
  {
    id: "text",
    label: "Text",
    title: "Choose your type",
    hint: "A face for headings, one for reading, and one for numbers and code. Take a pairing a system already uses, or pick each yourself.",
  },
  {
    id: "colour",
    label: "Colour",
    title: "Set your colours",
    hint: "Borrow a palette, then repaint what matters in each mode. Borders, quiet text and state fills follow on their own.",
  },
  {
    id: "shape",
    label: "Shape",
    title: "Round the corners",
    hint: "Cards take the outer radius and things inside them the inner one. Buttons can match the inner corners or go fully round.",
  },
  {
    id: "components",
    label: "Components",
    title: "Add components",
    hint: "Pick any from the registry to see them in your system. The install command at the end lists them.",
    optional: true,
  },
  {
    id: "review",
    label: "Review",
    title: "Take it with you",
    hint: "Copy the theme and the command that installs your components. The link brings all of it back.",
  },
];

export type View = { kind: "welcome" } | { kind: "steps"; step: Step } | { kind: "editor" };

/** A registry item as the playground needs it: rendered on the server, shown in the mix. */
export type Part = {
  name: string;
  title: string;
  category?: string;
  full: boolean;
  grow: boolean;
  replay: boolean;
  preview: ReactNode;
};

/** Components that touch most of the contract: surfaces, inks, accent, states and radii. */
const SAMPLES = ["todo-list", "metric-card", "searchable-select", "notification-toggle", "faq-accordion", "count-tabs"];

/** The picked parts in the order picked, or the samples while nothing is picked. */
export function partsFor(catalog: Part[], picked: string[]): { parts: Part[]; picked: boolean } {
  const find = (names: string[]) => names.flatMap((name) => catalog.filter((part) => part.name === name));
  const parts = find(picked);
  return parts.length ? { parts, picked: true } : { parts: find(SAMPLES), picked: false };
}
