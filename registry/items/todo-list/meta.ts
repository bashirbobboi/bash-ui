import type { ItemMeta } from "../../types.ts";

export const meta: ItemMeta = {
  name: "todo-list",
  title: "To-do list",
  kind: "widget",
  category: "lists",
  type: "registry:component",
  description:
    "A compact checklist card with an n-of-m count and springy progress bar, where a done step's tick pops in and a hand-drawn scribble strikes its title through.",
  whenToUse:
    "Use for a short list of steps to finish, such as onboarding or prep for a task, in a sidebar or beside the work; ticks can be read-only (marked done elsewhere) or tickable. Do not use for long or sortable task lists, or for multi-select in a form; use a table or the checkbox primitive.",
  files: ["registry/items/todo-list/todo-list.tsx"],
  dependencies: ["motion", "lucide-react"],
  origin: {
    project: "180Connect",
    path: "src/components/sidebar-checklist.tsx",
  },
  credits: [],
  props: [
    {
      name: "items",
      type: "{ id: string; title: string; done: boolean; href?: string }[]",
      description: "The steps, in order. An href makes the step's title a link.",
    },
    {
      name: "onToggle",
      type: "(id: string, done: boolean) => void | Promise<void>",
      description:
        "Makes each tick a checkbox. The tick shows the new state while the Promise runs and reverts if it rejects; update items when it resolves. Omit for read-only ticks.",
    },
    {
      name: "onItemClick",
      type: "(item: TodoItem) => void",
      description: "A step's title was activated (alongside the link when the step has an href).",
    },
    { name: "title", type: "string", description: 'Card heading. Defaults to "Getting started".' },
    {
      name: "fold",
      type: '"never" | "mobile" | "always"',
      description:
        "When the steps hide behind a tap on the header. mobile (the default) folds below the md breakpoint only.",
    },
    {
      name: "collapsed / collapsedHref / onCollapsedClick",
      type: "boolean / string / () => void",
      description:
        "Renders a square count chip (a sparkle when all done) for a collapsed sidebar rail, as a link or a button.",
    },
    {
      name: "tone",
      type: '"brand" | "lead" | "go"',
      description: "Colour of the ticks, scribbles and progress bar. Defaults to brand.",
    },
    { name: "className", type: "string", description: "Classes for the card." },
  ],
};
