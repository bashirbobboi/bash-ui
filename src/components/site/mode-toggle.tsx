"use client";

import { useCallback, useRef } from "react";
import { Moon, Sun } from "lucide-react";
import { motion, stagger, useAnimate, useReducedMotionConfig } from "motion/react";
import { useTheme } from "next-themes";

const SIZE = 36;
const SLATS = 6;
const CORD_REST = 8;
const CORD_PULL = 18;

/**
 * Light / dark for the whole site. Which design system shows is chosen per preview.
 *
 * Drawn as a window blind: pull the cord and the slats close, the mode changes
 * behind them, and they open on the other icon. Adapted from "Blind Pull
 * Toggle" by @aicanvas on 21st.dev (MIT):
 * https://21st.dev/@aicanvas/components/blind-pull-toggle
 *
 * Nothing rendered may depend on `resolvedTheme`: the server never knows it, so
 * a theme-dependent attribute hydrates as a mismatch. The icons switch by CSS
 * and the direction is decided at click time.
 */
export function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const reduce = useReducedMotionConfig();
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const busy = useRef(false);

  const toggle = useCallback(async () => {
    const next = resolvedTheme === "dark" ? "light" : "dark";
    if (reduce) {
      setTheme(next);
      return;
    }
    if (busy.current) return;
    busy.current = true;
    try {
      await animate("[data-cord]", { height: CORD_PULL }, { duration: 0.1, ease: [0.4, 0, 1, 1] });
      animate("[data-cord]", { height: CORD_REST }, { type: "spring", stiffness: 300, damping: 18 });
      await animate("[data-slat]", { scaleY: 0 }, { delay: stagger(0.04), duration: 0.1, ease: "easeIn" });
      setTheme(next);
      await animate("[data-slat]", { scaleY: 1 }, { delay: stagger(0.04), duration: 0.13, ease: "easeOut" });
    } finally {
      busy.current = false;
    }
  }, [animate, reduce, resolvedTheme, setTheme]);

  return (
    <div ref={scope} className="relative shrink-0">
      <motion.button
        type="button"
        onClick={toggle}
        aria-label="Toggle light and dark mode"
        whileHover={reduce ? undefined : { scale: 1.06 }}
        whileTap={reduce ? undefined : { scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        style={{ boxShadow: "var(--site-tile-shadow)" }}
        className="relative block size-9 rounded-[10px] text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <span className="absolute inset-0 overflow-hidden rounded-[10px]">
          {Array.from({ length: SLATS }, (_, i) => {
            const top = Math.round((i / SLATS) * SIZE);
            const bottom = Math.round(((i + 1) / SLATS) * SIZE);
            return (
              <span key={i} data-slat="" className="absolute inset-x-0 overflow-hidden" style={{ top, height: bottom - top }}>
                <span className="absolute left-0 grid size-9 place-items-center" style={{ top: -top, background: "var(--site-tile)" }}>
                  <Sun className="size-4 dark:hidden" />
                  <Moon className="hidden size-4 dark:block" />
                </span>
              </span>
            );
          })}
        </span>
      </motion.button>
      {/* The cord is a second, pointer-only handle; the button is the control. */}
      <span
        aria-hidden="true"
        onClick={toggle}
        className="absolute top-full left-1/2 flex -translate-x-1/2 cursor-pointer flex-col items-center px-2"
      >
        <span data-cord="" className="w-px bg-linear-to-b from-faint to-transparent" style={{ height: CORD_REST }} />
        <span className="size-1.5 rounded-full bg-faint" />
      </span>
    </div>
  );
}
