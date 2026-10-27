import type { ItemCategory } from "@/registry/types";

/** Sidebar order, and what each collection page says about itself. */
export const CATEGORIES: { slug: ItemCategory; label: string; sub: string }[] = [
  { slug: "buttons", label: "Buttons", sub: "Every button, side by side. Press them: most of the point is in what happens next." },
  { slug: "navigation", label: "Top navbars & navigation", sub: "Tab rows that sit at the top of a page, and the sidebar that holds the whole app together." },
  { slug: "inputs", label: "Inputs", sub: "Fields, toggles, sliders and pickers." },
  { slug: "charts", label: "Charts", sub: "Gauges, curves and the cards that frame them." },
  { slug: "data-display", label: "Data display", sub: "Ways of showing one number so it means something." },
  { slug: "media", label: "Images & media", sub: "Portraits, artwork and collections of images." },
  { slug: "text", label: "Text & type", sub: "Words that move: wordmarks, headlines and reveals." },
  { slug: "lists", label: "Lists", sub: "Things to tick off and things to work through." },
  { slug: "feedback", label: "Feedback", sub: "Asking people what they think, at the right moment." },
  { slug: "overlays", label: "Menus & overlays", sub: "Tooltips, menus and anything else that floats." },
];

export function getCategory(slug: string) {
  return CATEGORIES.find((category) => category.slug === slug);
}
