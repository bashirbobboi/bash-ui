import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CategoryPage } from "@/components/site/category-page";
import { ITEMS, getItem } from "@/registry/items";

// A name not in the build waits for its full render instead of being sent the
// prerendered shell first, so an unknown one returns a 404, not a 200 that says
// "not found". It also means nothing on this route may render per request.
export const ensureStatic = "navigation";

export function generateStaticParams() {
  return ITEMS.map((item) => ({ name: item.meta.name }));
}

export async function generateMetadata({ params }: PageProps<"/components/[name]">): Promise<Metadata> {
  const { name } = await params;
  return { title: getItem(name)?.meta.title ?? "Component" };
}

export default function Page({ params }: PageProps<"/components/[name]">) {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <ComponentBody params={params} />
    </Suspense>
  );
}

/** A component's page is its category's page, focused on it. */
async function ComponentBody({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const meta = getItem(name)?.meta;
  if (!meta?.category) notFound();
  return <CategoryPage category={meta.category} focus={meta.name} />;
}
