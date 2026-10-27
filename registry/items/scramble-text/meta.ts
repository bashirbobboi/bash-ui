import type { ItemMeta } from "../../types.ts";

export const meta: ItemMeta = {
  name: "scramble-text",
  title: "Scramble text",
  kind: "primitive",
  category: "text",
  previewReplay: true,
  type: "registry:ui",
  description:
    "A wordmark that scrambles into place a letter at a time, flashes a decoy word that is struck out, then rises in for good.",
  whenToUse:
    "Use once, for a brand moment: a splash screen, the first sight of a wordmark, a reveal on a landing page. Allow room for its 10vh entrance. At the default pace it settles after 2.6 seconds.",
  files: ["registry/items/scramble-text/scramble-text.tsx"],
  dependencies: ["motion"],
  registryDependencies: [],
  origin: { project: "Steeze", path: "src/App.jsx (splash: splashReducer, scrambleWords and the scramble/strike/after phases)" },
  credits: [],
  props: [
    { name: "text", type: "string", description: "The word the scramble lands on." },
    {
      name: "frames",
      type: "string[]",
      description: 'Frames shown on the way. "Steeze" uses the original landing-page sequence; other text uses a seeded reveal. The first frame holds for two ticks.',
    },
    {
      name: "decoy",
      type: "string | null",
      description: 'Struck-out word shown before the text lands. Defaults to "xo" repeated to the text\'s length; null or "" skips it.',
    },
    { name: "frameDuration", type: "number", description: "Milliseconds per scramble frame. Defaults to 100." },
    { name: "play", type: "boolean", description: "Plays the sequence (default). False shows the text at rest; switching back on replays." },
    { name: "onComplete", type: "() => void", description: "Called once the text has landed." },
    {
      name: "...span props",
      type: "HTMLAttributes<HTMLSpanElement>",
      description: "className and the rest. Font, size and colour are inherited. Tracking is −0.02em during the scramble and −0.05em on the final word.",
    },
  ],
};
