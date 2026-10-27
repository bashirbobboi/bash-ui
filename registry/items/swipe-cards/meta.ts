import type { ItemMeta } from "../../types.ts";

export const meta: ItemMeta = {
  name: "swipe-cards",
  title: "Swipe cards",
  kind: "pattern",
  category: "lists",
  type: "registry:block",
  description:
    "A stack of photo cards to swipe right to like or left to skip: the card tilts as it travels, a stamp and the matching button fill in near the commit point, and the cards behind rise to take its place.",
  whenToUse:
    "Use for fast, one-at-a-time judgements over visual items: a discovery feed, a taste survey, tuning recommendations. Not for anything people need to compare side by side or come back to; a swipe is gone. Buttons and the arrow keys do the same as a drag.",
  files: ["registry/items/swipe-cards/swipe-cards.tsx"],
  dependencies: ["motion", "lucide-react"],
  registryDependencies: [],
  origin: {
    project: "Steeze",
    path: "components/swipe/SwipeDeck.tsx + SwipeCard.tsx (app/(root)/(tabs)/steeze.tsx)",
  },
  credits: [
    {
      name: "Steeze category photos, found on Pinterest (original photographers unknown); gallery preview only, not shipped",
      license: "unknown",
    },
  ],
  props: [
    {
      name: "items",
      type: "SwipeCardsItem[]",
      description: "Cards: id, title, image, and optional price, brand, condition, size and description.",
    },
    {
      name: "variant",
      type: '"feed" | "choice"',
      description: "feed: round skip and heart buttons with price and condition, as on the Steeze tab. choice: two labelled pills that fill as the card leans.",
    },
    { name: "leftLabel", type: "string", description: 'Left action and its stamp. Defaults to "Skip" (feed) or "No" (choice).' },
    { name: "rightLabel", type: "string", description: 'Right action. Defaults to "Like" (feed, stamped ♥) or "Yes" (choice).' },
    { name: "loop", type: "boolean", description: "Start again after the last card. Defaults to true." },
    {
      name: "onSwipe",
      type: '(item, direction: "left" | "right", index) => void',
      description: "A card left the deck, by drag, button or arrow key.",
    },
    { name: "onIndexChange", type: "(index: number) => void", description: "The top card changed." },
    { name: "onEmpty", type: "() => void", description: "Every card is gone (loop off). `empty` renders in its place." },
    { name: "onCardPress", type: "(item) => void", description: "The top card was tapped, or Enter was pressed on the deck." },
    { name: "onAddToBag", type: "(item) => void", description: 'Shows an "Add to Bag" chip on each card (label: addToBagLabel).' },
    {
      name: "onThresholdCross",
      type: '(direction: "left" | "right") => void',
      description: "The drag crossed the commit point; play a haptic here on devices that have one.",
    },
    { name: "label", type: "string", description: "Accessible name for the deck." },
  ],
};
