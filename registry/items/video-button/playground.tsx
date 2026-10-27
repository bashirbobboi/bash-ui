"use client";

import type { PlaygroundSpec } from "../../types.ts";
import { GET_IN_TOUCH_CLIP } from "./fixtures.ts";
import { VideoButton, type VideoButtonSize } from "./video-button.tsx";

export const playground: PlaygroundSpec = {
  component: "VideoButton",
  controls: [
    { type: "text", name: "label", label: "Label", default: "Get in touch" },
    { type: "select", name: "size", label: "Size", options: ["sm", "md", "lg"], default: "lg" },
    { type: "boolean", name: "disabled", label: "Disabled", default: false },
  ],
  render: (values) => (
    <VideoButton
      mediaSrc={GET_IN_TOUCH_CLIP}
      label={String(values.label)}
      size={values.size as VideoButtonSize}
      disabled={Boolean(values.disabled)}
    />
  ),
  codeProps: ['mediaSrc="/media/get-in-touch.mp4"', "onClick={openContact}"],
};
