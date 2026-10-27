"use client";

import { steezeQr } from "./fixtures.ts";
import { QrCode } from "./qr-code.tsx";

export default function QrCodePreview() {
  return <QrCode {...steezeQr} size={192} />;
}
