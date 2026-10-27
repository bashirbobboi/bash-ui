"use client";

import { looks } from "./fixtures.ts";
import { SwipeCards } from "./swipe-cards.tsx";

export default function SwipeCardsPreview() {
  return <SwipeCards items={looks} onAddToBag={() => {}} label="Looks for you" className="max-w-[320px]" />;
}
