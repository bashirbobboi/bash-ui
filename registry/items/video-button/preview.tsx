"use client";

import { GET_IN_TOUCH_CLIP } from "./fixtures.ts";
import { VideoButton } from "./video-button.tsx";

export default function VideoButtonPreview() {
  return <VideoButton mediaSrc={GET_IN_TOUCH_CLIP} />;
}
