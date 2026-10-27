"use client";

import { Liquid } from "liquid-gooey";
import { useReducedMotionConfig } from "motion/react";
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * A segmented pill with one liquid indicator (`liquid-gooey`, `effect="move"`):
 * the marker trails the tab you picked with a droplet tail instead of cutting
 * to it. The indicator is a single element that translates, not a highlight on
 * each tab — that is what gives `move` something to chase. Every tab is the
 * same width so the offset is `index * tabWidth` and nothing is measured.
 *
 * Ported from 180Connect's client-record tabs with the routing lifted out.
 */

export type GooeyTabItem = {
  id: string;
  label: ReactNode;
  /** With an href the tab renders as a link; without one, as a button. */
  href?: string;
  /** Shown beside the label when above zero. */
  count?: number | null;
};

export type GooeyTabLinkProps = {
  item: GooeyTabItem;
  href: string;
  className: string;
  style: CSSProperties;
  "aria-current"?: "page";
  onClick: () => void;
  children: ReactNode;
};

const PHONE_QUERY = "(width < 40rem)";

function subscribePhone(onChange: () => void) {
  const query = window.matchMedia(PHONE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function useIsPhone() {
  return useSyncExternalStore(
    subscribePhone,
    () => window.matchMedia(PHONE_QUERY).matches,
    () => false,
  );
}

export function GooeyTabs({
  items,
  value,
  defaultValue,
  onValueChange,
  renderLink,
  tabWidth = 112,
  ariaLabel = "Sections",
  gooBlur = 5,
  gooContrast = 18,
  className,
}: {
  items: GooeyTabItem[];
  /** The open tab. null, or an id not in `items`, hides the marker. */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (id: string) => void;
  /** Renders a tab that has an href, e.g. with next/link. Defaults to <a>. */
  renderLink?: (props: GooeyTabLinkProps) => ReactNode;
  /** Every tab's width in px; size it for the longest label plus its count. */
  tabWidth?: number;
  ariaLabel?: string;
  gooBlur?: number;
  gooContrast?: number;
  className?: string;
}) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? items[0]?.id ?? null);
  const current = value !== undefined ? value : uncontrolled;
  const activeIndex = items.findIndex((item) => item.id === current);
  const stripRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotionConfig();

  // On a phone (and under reduced motion) the active tab wears its own solid
  // pill and the liquid indicator is not mounted at all — not hidden with CSS.
  // liquid-gooey paints each item's silhouette into its own SVG layer, which a
  // `display: none` never reaches; a hidden item also stops getting the
  // transition events that wake it, and its silhouette freezes mid-stretch.
  const isPhone = useIsPhone();

  // The same goes for a strip too narrow for its tabs: once it scrolls, the
  // liquid layer (painted in its own SVG) no longer lines up with the tabs and
  // leaves a stray silhouette beside them. So a strip that overflows wears the
  // solid pill as well.
  const [overflowing, setOverflowing] = useState(false);
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const check = () => setOverflowing(strip.scrollWidth > strip.clientWidth + 1);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(strip);
    return () => observer.disconnect();
  }, [items.length, tabWidth]);

  const liquid = !isPhone && !reduce && !overflowing;

  // Keep the selected tab fully visible on narrow screens.
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip || activeIndex < 0) return;
    strip.scrollLeft = Math.max(0, activeIndex * tabWidth - (strip.clientWidth - tabWidth) / 2);
  }, [activeIndex, tabWidth]);

  function select(id: string) {
    if (value === undefined) setUncontrolled(id);
    onValueChange?.(id);
  }

  return (
    <nav aria-label={ariaLabel} className={cn("py-2", className)}>
      <div className="relative inline-flex max-w-full rounded-full">
        {/* Frosted glass, sized to the pill. A sibling of the liquid layer, not
            a descendant: a backdrop-filter is defeated by any `filter` in its
            own subtree, and Liquid paints the droplet with one. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 rounded-full border border-rule bg-card/60 shadow-[0_1px_2px_color-mix(in_oklab,var(--ink)_6%,transparent)] backdrop-blur-md"
        />
        <Liquid
          ref={stripRef}
          blur={gooBlur}
          contrast={gooContrast}
          fill="var(--ink)"
          shadow="0 1px 2px color-mix(in oklab, var(--ink) 6%, transparent)"
          className="relative z-10 inline-flex max-w-full items-center overflow-x-auto rounded-full bg-transparent p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {liquid && (
            <Liquid.Item effect="move" move={{ springiness: 0.6, trail: 0.5, stretch: 0.25 }}>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute top-1 bottom-1 left-1 rounded-full bg-ink transition-[transform,opacity] duration-300"
                style={{
                  width: `${tabWidth}px`,
                  transform: `translateX(${Math.max(activeIndex, 0) * tabWidth}px)`,
                  opacity: activeIndex === -1 ? 0 : 1,
                }}
              />
            </Liquid.Item>
          )}

          <div className="relative z-10 flex items-center">
            {items.map((item, index) => {
              const active = index === activeIndex;
              const tabClass = cn(
                "flex h-8 shrink-0 items-center justify-center rounded-full text-[13px] whitespace-nowrap transition-colors duration-200 pointer-coarse:min-h-11 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-lead-mid",
                active
                  ? cn("font-bold text-on-solid", liquid ? "bg-transparent" : "bg-ink")
                  : "cursor-pointer font-semibold text-dim hover:text-ink",
              );
              const style = { width: `${tabWidth}px` };
              const children = (
                <>
                  {item.label}
                  {item.count != null && item.count > 0 && (
                    <span className="ml-1.5 font-mono text-[10.5px] text-faint tabular-nums">{item.count}</span>
                  )}
                </>
              );

              if (item.href) {
                const linkProps: GooeyTabLinkProps = {
                  item,
                  href: item.href,
                  className: tabClass,
                  style,
                  "aria-current": active ? "page" : undefined,
                  onClick: () => select(item.id),
                  children,
                };
                if (renderLink) return <span key={item.id}>{renderLink(linkProps)}</span>;
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    className={tabClass}
                    style={style}
                    aria-current={linkProps["aria-current"]}
                    onClick={linkProps.onClick}
                  >
                    {children}
                  </a>
                );
              }

              return (
                <button
                  key={item.id}
                  type="button"
                  aria-current={active ? "true" : undefined}
                  onClick={() => select(item.id)}
                  className={tabClass}
                  style={style}
                >
                  {children}
                </button>
              );
            })}
          </div>
        </Liquid>
      </div>
    </nav>
  );
}
