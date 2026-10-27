import type { ItemMeta } from "../../types.ts";

export const meta: ItemMeta = {
  name: "saved-board",
  title: "Saved board",
  kind: "widget",
  category: "media",
  type: "registry:component",
  description:
    "A saved-items board as a frosted pocket: up to five covers fan out of the top and bob gently on their own beats, with the board's name, owner and item count on the glass.",
  whenToUse:
    "Use for collections people make and share, such as boards, wishlists or lookbooks, in a carousel or grid where the covers should do the talking. Not for a single product; use an ordinary product card for that.",
  files: ["registry/items/saved-board/saved-board.tsx"],
  dependencies: ["motion", "lucide-react"],
  registryDependencies: [],
  origin: { project: "Steeze", path: "components/SuggestedBoardCard.tsx (app_steeze; discovery and search)" },
  credits: [
    {
      name: "Steeze category photos, found on Pinterest (original photographers unknown); preview fixtures only, not shipped",
      license: "unknown",
    },
  ],
  props: [
    { name: "title", type: "string", description: "The board's name, printed on the glass in the heading face." },
    {
      name: "images",
      type: "(string | { src: string; alt?: string })[]",
      description: "Cover images; the first five fan out (one to five each have their own arrangement). None shows a bookmark placeholder.",
    },
    { name: "itemCount", type: "number", description: "Items on the board. Defaults to the number of images." },
    { name: "views", type: "number", description: "Optional view count, shown after the item count." },
    { name: "owner", type: "{ name: string; avatarSrc?: string }", description: "Optional maker: an 18px avatar (or initial) and name." },
    { name: "size", type: "number", description: "Card width in pixels; height is 1.15 times it. Defaults to 228, the app's 58% of a phone width." },
    { name: "href", type: "string", description: "Renders the card as a link." },
    { name: "onClick", type: "MouseEventHandler", description: "Renders the card as a button when there is no href." },
  ],
};
