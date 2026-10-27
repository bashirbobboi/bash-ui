import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CategoryPage } from "@/components/site/category-page";
import { CATEGORIES, getCategory } from "@/lib/categories";
import { ITEMS } from "@/registry/items";

// A slug not in the build waits for its full render instead of being sent the
// prerendered shell first, so an unknown one returns a 404, not a 200 that says
// "not found". It also means nothing on this route may render per request.
export const ensureStatic = "navigation";

export function generateStaticParams() {
  return CATEGORIES.filter((category) => ITEMS.some((item) => item.meta.category === category.slug)).map(
    (category) => ({ slug: category.slug }),
  );
}

export async function generateMetadata({ params }: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return { title: getCategory(slug)?.label ?? "Collection" };
}

export default function Page({ params }: PageProps<"/collections/[slug]">) {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <CollectionBody params={params} />
    </Suspense>
  );
}

/** A category's page, focused on its first member. */
async function CollectionBody({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category || !ITEMS.some((item) => item.meta.category === category.slug)) notFound();
  return <CategoryPage category={category.slug} />;
}
