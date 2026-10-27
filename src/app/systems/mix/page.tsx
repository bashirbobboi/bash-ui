import type { Metadata } from "next";
import { Suspense } from "react";
import { PageTitle } from "@/components/site/cards";
import type { Part } from "@/components/site/mix-flow";
import { MixPlayground } from "@/components/site/mix-playground";
import { ITEMS } from "@/registry/items";

export const metadata: Metadata = { title: "Playground" };

export default function MixPage() {
  // Every item, rendered here once, so any of them can be picked into the mix.
  const catalog: Part[] = ITEMS.map(({ meta, Preview }) => ({
    name: meta.name,
    title: meta.title,
    category: meta.category,
    full: meta.previewWidth === "full",
    grow: Boolean(meta.previewGrow),
    replay: Boolean(meta.previewReplay),
    preview: <Preview />,
  }));

  return (
    <div className="space-y-8">
      <Suspense fallback={<div className="min-h-dvh" />}>
        <MixPlayground
          catalog={catalog}
          title={
            <PageTitle
              title="Playground"
              sub="Make a design system of your own from the six here: step through it, or tune everything at once in the editor. Nothing leaves your browser; the link is the mix."
            />
          }
        />
      </Suspense>
    </div>
  );
}
