"use client";

import type { PlaygroundSpec } from "../../types.ts";
import { SITE_URL } from "@/lib/site";
import { LinkPreview } from "./link-preview.tsx";

export const playground: PlaygroundSpec = {
  component: "LinkPreview",
  controls: [
    { type: "text", name: "title", label: "Title", default: "bashir.is-a.dev" },
    { type: "text", name: "href", label: "Destination", default: "https://bashir.is-a.dev" },
    { type: "text", name: "imageSrc", label: "Page screenshot URL", default: `${SITE_URL}/demo/portfolio-homepage.png` },
    { type: "select", name: "side", label: "Position", options: ["top", "right", "bottom", "left"], default: "top" },
  ],
  render: (values) => <LinkPreview title={String(values.title)} href={String(values.href)} imageSrc={String(values.imageSrc) === `${SITE_URL}/demo/portfolio-homepage.png` ? "/demo/portfolio-homepage.png" : String(values.imageSrc)} side={values.side as "top" | "right" | "bottom" | "left"}>My portfolio</LinkPreview>,
  codeProps: ['children="My portfolio"'],
};
