"use client";

import { useState, type MouseEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotionConfig } from "motion/react";

export type MenuItem = { label: string; href: string };

const DEFAULT_ITEMS: MenuItem[] = [
  { label: "Home", href: "#" },
  { label: "Services", href: "#" },
  { label: "Case", href: "#" },
  { label: "About", href: "#" },
  { label: "Contact", href: "#" },
];

const spring = { type: "spring", stiffness: 320, damping: 32 } as const;

const COLLAPSED_W = 148;
const PANEL_W = 300;

export function ExpandingMenu({
  items = DEFAULT_ITEMS,
  label = "Menu",
  footer,
  align = "left",
  onNavigate,
}: {
  items?: MenuItem[];
  label?: string;
  /** Optional node pinned to the bottom of the open panel (e.g. sign out). */
  footer?: ReactNode;
  /** Which edge stays anchored as the panel grows. */
  align?: "left" | "right";
  onNavigate?: (item: MenuItem, event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  const [open, setOpen] = useState(false);
  const reducedMotion = useReducedMotionConfig();
  const close = () => setOpen(false);

  // Panel height is derived so the morph lands exactly on the content size.
  const expandedH = 56 + items.length * 46 + (footer ? 84 : 28);

  return (
    <div className="relative h-14 font-body" style={{ width: COLLAPSED_W }}>
      {/* The blurred background — this single element morphs pill -> panel. */}
      <motion.div
        initial={false}
        animate={{
          width: open ? PANEL_W : COLLAPSED_W,
          height: open ? expandedH : 56,
        }}
        transition={reducedMotion ? { duration: 0 } : spring}
        className={`absolute top-0 overflow-hidden rounded-[28px] bg-menu-surface text-menu-symbol shadow-2xl shadow-menu-shadow ring-1 ring-menu-rule backdrop-blur-xl backdrop-saturate-200 backdrop-brightness-90 ${
          align === "right" ? "right-0" : "left-0"
        }`}
      >
        {/* Frosted highlight — milky sheen across the top, fading down. */}
        <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-gradient-to-b from-menu-sheen via-menu-sheen-mid to-transparent" />
        <div className="relative flex h-full flex-col">
          {/* Header — toggles open/close. Stays put while the bg grows under it. */}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex h-14 shrink-0 items-center justify-between px-5 text-[15px] font-medium tracking-tight"
          >
            <span className="relative inline-grid">
              <AnimatePresence initial={false} mode="popLayout">
                <motion.span
                  key={open ? "close" : "menu"}
                  initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : open ? 8 : -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: reducedMotion ? 0 : open ? -8 : 8 }}
                  transition={{ duration: reducedMotion ? 0 : 0.18 }}
                  className="col-start-1 row-start-1 whitespace-nowrap text-menu-ink"
                >
                  {open ? "Close" : label}
                </motion.span>
              </AnimatePresence>
            </span>

            {/* + morphs into — : drop the vertical bar. */}
            <span className="relative block h-4 w-4 text-menu-ink">
              <span className="absolute inset-x-0 top-1/2 h-[1.5px] -translate-y-1/2 bg-current" />
              <motion.span
                animate={{ scaleY: open ? 0 : 1, opacity: open ? 0 : 1 }}
                transition={{ duration: reducedMotion ? 0 : 0.2 }}
                className="absolute inset-y-0 left-1/2 w-[1.5px] -translate-x-1/2 bg-current"
              />
            </span>
          </button>

          {/* Body — fades/staggers in once the panel has room. */}
          <AnimatePresence>
            {open && (
              <motion.nav
                initial={{ opacity: reducedMotion ? 1 : 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reducedMotion ? 0 : 0.2 }}
                className="flex flex-1 flex-col px-5 pb-5"
              >
                <div className="flex flex-1 flex-col justify-center gap-0.5">
                  {items.map((item, i) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={reducedMotion ? { duration: 0 } : { delay: 0.1 + i * 0.05, ...spring }}
                    >
                      <a
                        href={item.href}
                        onClick={(event) => { onNavigate?.(item, event); close(); }}
                        className="block py-1 text-2xl font-light leading-snug text-menu-dim transition-colors hover:text-menu-ink"
                      >
                        {item.label}
                      </a>
                    </motion.div>
                  ))}
                </div>

                {footer && (
                  <motion.div
                    initial={{ opacity: reducedMotion ? 1 : 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: reducedMotion ? 0 : 0.1 + items.length * 0.05, ...(reducedMotion ? { duration: 0 } : {}) }}
                    className="mt-4 border-t border-menu-footer-rule pt-4 text-sm text-menu-dim [&_a:hover]:text-menu-ink [&_a]:transition-colors [&_button:hover]:text-menu-ink [&_button]:transition-colors"
                  >
                    {footer}
                  </motion.div>
                )}
              </motion.nav>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
