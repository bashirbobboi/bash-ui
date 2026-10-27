"use client";

import { LoadingButton } from "./loading-button.tsx";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function LoadingButtonPreview() {
  return (
    <LoadingButton
      label="Check for new grants"
      pendingLabel="Checking 360Giving…"
      onAction={async () => {
        await wait(1400);
        return { ok: true, message: "1 new grant" };
      }}
    />
  );
}
