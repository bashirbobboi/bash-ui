"use client";

import { SavedBoard } from "./saved-board.tsx";
import { boardImages } from "./fixtures.ts";

export default function SavedBoardPreview() {
  return <SavedBoard title="Off-duty layers" images={boardImages} itemCount={24} owner={{ name: "bashir" }} />;
}
