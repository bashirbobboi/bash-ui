import Link from "next/link";
import { Blend } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import { ITEMS } from "@/registry/items";
import { THEMES } from "@/themes";
import { ItemIcon, SystemIcon } from "./item-icon";
import { SidebarLink } from "./sidebar-link";

/**
 * The docs rail: pinned under the header on desktop, a sideways-scrolling
 * strip of chips under 900px (the libraries.dev pattern), so a phone never
 * loses the content to it.
 *
 * On desktop it scrolls on its own and independently of the page: a scroll
 * over the rail moves only the rail, and reaching its end does not hand the
 * scroll on to the page (`overscroll-contain`). A scroll over the page never
 * moves the rail. Its scrollbar is hidden, so it fades at whichever end has
 * more links past it (`site-rail-fade`).
 * Components are grouped by what they are for; each group's label opens a page
 * showing every member side by side. A component's link opens that same page
 * and leaves the scrolling to it (`scroll={false}`): the page brings the
 * component's tile into view itself, instead of Next jumping to the top first.
 */
export function SiteSidebar() {
  return (
    <aside className="min-w-0 pt-4 min-[900px]:-ml-2 min-[900px]:sticky min-[900px]:top-(--header-h) min-[900px]:h-[calc(100dvh-var(--header-h))] min-[900px]:self-start min-[900px]:overflow-y-auto min-[900px]:overscroll-contain min-[900px]:pt-8 min-[900px]:pb-8 min-[900px]:[scrollbar-width:none] site-rail-fade">
      <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 [scrollbar-width:none] min-[900px]:mx-0 min-[900px]:flex-col min-[900px]:gap-4 min-[900px]:overflow-visible min-[900px]:px-0">
        <Group label="Getting started">
          <SidebarLink href="/" exact>
            Introduction
          </SidebarLink>
          <SidebarLink href="/how-to-use">How to use</SidebarLink>
        </Group>

        <Group label="Design systems" href="/systems">
          {THEMES.map((theme) => (
            <SidebarLink key={theme.slug} href={`/systems/${theme.slug}`} icon={<SystemIcon slug={theme.slug} />}>
              {theme.name}
            </SidebarLink>
          ))}
          <SidebarLink href="/systems/mix" icon={<ItemIcon name="playground" icon={Blend} />}>
            Playground
          </SidebarLink>
        </Group>

        {CATEGORIES.map((category) => {
          const items = ITEMS.filter((item) => item.meta.category === category.slug);
          if (items.length === 0) return null;
          return (
            <Group key={category.slug} label={category.label} href={`/collections/${category.slug}`}>
              {items.map(({ meta }) => (
                <SidebarLink
                  key={meta.name}
                  href={`/components/${meta.name}`}
                  scroll={false}
                  icon={<ItemIcon name={meta.name} />}
                >
                  {meta.title}
                </SidebarLink>
              ))}
            </Group>
          );
        })}
      </nav>
    </aside>
  );
}

function Group({ label, href, children }: { label: string; href?: string; children: React.ReactNode }) {
  const labelClass = "hidden px-4 py-[9px] text-[11px] leading-[14px] text-faint min-[900px]:flex items-center justify-between";
  return (
    <div className="contents min-[900px]:flex min-[900px]:min-w-0 min-[900px]:flex-col">
      {href ? (
        <Link href={href} className={`${labelClass} group transition-colors hover:text-ink`}>
          {label}
          <span className="opacity-0 transition-opacity group-hover:opacity-100">See all →</span>
        </Link>
      ) : (
        <div className={labelClass}>{label}</div>
      )}
      <div className="contents min-[900px]:flex min-[900px]:flex-col min-[900px]:gap-1">{children}</div>
    </div>
  );
}
