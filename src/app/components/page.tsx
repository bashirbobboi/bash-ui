import type { Metadata } from "next";
import Link from "next/link";
import { PageTitle, SectionHeading, TextLink } from "@/components/site/cards";
import { Tile, TileGrid } from "@/components/site/tiles";
import { CATEGORIES } from "@/lib/categories";
import { ITEMS } from "@/registry/items";
import { THEMES } from "@/themes";

export const metadata: Metadata = { title: "Components" };

/** Every component once, grouped by category, each in the design system it came from. */
export default function ComponentsPage() {
  return (
    <div className="space-y-12">
      <PageTitle title="Components" sub="Every component, once. Open one for its playground and install steps." />
      {CATEGORIES.map((category) => {
        const items = ITEMS.filter((item) => item.meta.category === category.slug);
        if (items.length === 0) return null;
        return (
          <section key={category.slug} className="space-y-4">
            <SectionHeading
              title={category.label}
              action={<TextLink href={`/collections/${category.slug}`}>Playground →</TextLink>}
            />
            <TileGrid>
              {items.map(({ meta, Preview }) => (
                <Tile
                  key={meta.name}
                  theme={THEMES.find((theme) => theme.project === meta.origin.project)?.slug ?? THEMES[0].slug}
                  label={meta.title}
                  replay={meta.previewReplay}
                  grow={meta.previewGrow}
                  className={meta.previewWidth === "full" ? "md:col-span-2" : undefined}
                  corner={
                    <Link
                      href={`/components/${meta.name}`}
                      className="site-chip inline-flex h-7 items-center rounded-full px-2.5 text-[12px] font-medium text-ink"
                    >
                      Open
                    </Link>
                  }
                >
                  <Preview />
                </Tile>
              ))}
            </TileGrid>
          </section>
        );
      })}
    </div>
  );
}
