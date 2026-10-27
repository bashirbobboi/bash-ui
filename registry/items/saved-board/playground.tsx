"use client";

import type { PlaygroundSpec } from "../../types.ts";
import { SavedBoard } from "./saved-board.tsx";
import { boardImages } from "./fixtures.ts";

export const playground: PlaygroundSpec = {
  component: "SavedBoard",
  controls: [
    { type: "text", name: "title", label: "Title", default: "Off-duty layers" },
    { type: "number", name: "images", label: "Images", min: 0, max: 5, step: 1, default: 5 },
    { type: "number", name: "itemCount", label: "Items", min: 0, max: 200, step: 1, default: 24 },
    { type: "number", name: "views", label: "Views", min: 0, max: 5000, step: 50, default: 0 },
    { type: "number", name: "size", label: "Size", min: 160, max: 320, step: 4, default: 228 },
  ],
  render: (values) => (
    <SavedBoard
      title={String(values.title)}
      images={boardImages.slice(0, Number(values.images))}
      itemCount={Number(values.itemCount)}
      views={Number(values.views) > 0 ? Number(values.views) : undefined}
      size={Number(values.size)}
      owner={{ name: "bashir" }}
    />
  ),
  codeProps: ['owner={{ name: "bashir" }}', "onClick={openBoard}"],
};
