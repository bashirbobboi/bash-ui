import type { ItemMeta } from "../../types.ts";

export const meta: ItemMeta = {
  name: "video-button",
  title: "Video button",
  kind: "primitive",
  category: "buttons",
  type: "registry:ui",
  description:
    "A button with theme-specific resting colours that reveals a looping clip or GIF on hover, under a dark scrim with a light label.",
  whenToUse:
    "Use for one playful, low-stakes action with personality, such as Get in touch at the end of an FAQ. Do not use for primary flows or repeated actions; the media is a flourish and costs bandwidth.",
  files: ["registry/items/video-button/video-button.tsx"],
  dependencies: ["motion"],
  registryDependencies: [],
  origin: { project: "Steeze", path: "src/components/ui/media-button.jsx (used by src/components/ui/faq-section.jsx)" },
  credits: [
    {
      name: "GIPHY clip used on steeze.ng (creator not recorded; GIPHY's terms cover embedding through GIPHY, not rehosting the file); gallery preview only, not shipped",
      license: "unknown",
    },
  ],
  props: [
    { name: "mediaSrc", type: "string", description: "A looping clip (mp4, webm) or an image or GIF, revealed behind the label." },
    { name: "label", type: "ReactNode", description: 'The label. Defaults to "Get in touch".' },
    {
      name: "mediaType",
      type: '"video" | "image"',
      description: "Overrides detection from the extension; mp4, webm, mov and m4v are video.",
    },
    { name: "poster", type: "string", description: "Video only: the frame before playback, and the still under reduced motion." },
    { name: "size", type: '"sm" | "md" | "lg"', description: "40px, 44px or 52px (default) tall." },
    { name: "href", type: "string", description: "Given, renders an <a>; omitted, renders a <button>." },
    {
      name: "...anchor or button props",
      type: "AnchorHTMLAttributes | ButtonHTMLAttributes",
      description: "onClick, target, rel, disabled (button only), className (merged) and the rest.",
    },
  ],
};
