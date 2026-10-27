"use client";

import type { PlaygroundSpec } from "../../types.ts";
import { AppStoreBadge, type Store } from "./app-store-badge.tsx";

const LISTINGS: Record<Store, string> = {
  "app-store": "https://apps.apple.com/us/app/steeze/id6759175282",
  "google-play": "https://play.google.com/store/apps/details?id=ng.steeze.app",
};

export const playground: PlaygroundSpec = {
  component: "AppStoreBadge",
  controls: [
    {
      type: "select",
      name: "store",
      label: "Store",
      options: [
        { value: "app-store", label: "App Store" },
        { value: "google-play", label: "Google Play" },
      ],
      default: "app-store",
    },
    { type: "select", name: "variant", label: "Variant", options: ["solid", "outline"], default: "solid" },
    { type: "select", name: "shape", label: "Shape", options: ["inset", "pill"], default: "inset" },
    { type: "boolean", name: "newTab", label: "New tab", default: true },
  ],
  render: (values) => {
    const store = values.store as Store;
    return (
      <AppStoreBadge
        store={store}
        href={LISTINGS[store]}
        variant={values.variant as "solid" | "outline"}
        shape={values.shape as "inset" | "pill"}
        newTab={Boolean(values.newTab)}
      />
    );
  },
  codeProps: ['href="https://apps.apple.com/app/id…"'],
};
