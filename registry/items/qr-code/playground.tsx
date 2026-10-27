"use client";

import type { PlaygroundSpec } from "../../types.ts";
import { steezeQr } from "./fixtures.ts";
import { QrCode } from "./qr-code.tsx";

export const playground: PlaygroundSpec = {
  component: "QrCode",
  controls: [
    { type: "number", name: "size", label: "Size", min: 96, max: 320, step: 8, default: 224 },
    { type: "text", name: "alt", label: "Alt text", default: steezeQr.alt },
    { type: "boolean", name: "invertOnLight", label: "Invert in light mode", default: true },
  ],
  render: (values) => (
    <QrCode
      src={steezeQr.src}
      alt={String(values.alt)}
      size={Number(values.size)}
      invertOnLight={Boolean(values.invertOnLight)}
    />
  ),
  codeProps: ['src="/qrcode.webp"'],
};
