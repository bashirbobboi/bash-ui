"use client";

import * as React from "react";
import { motion, useReducedMotionConfig, type Variants } from "motion/react";

import { cn } from "@/lib/utils";

/**
 * `glass` sits on a light page: an ink capsule at 72%, a lime accent, and a
 * backdrop blur that bites on whatever is behind it. `sheet` is its twin on a
 * solid ink surface (an open menu, a dark panel): a faint on-solid tint where
 * the other is glass, on-solid where the other is lime, and no blur, because
 * there is nothing behind flat ink to pick up.
 */
export type CtaTone = "glass" | "sheet";

/** `lg` is the hero pair (40px tall), `sm` the nav pair (36px). */
export type CtaSize = "sm" | "lg";

/** One curve for the whole chain. */
const EASE = [0.2, 0.7, 0.2, 1] as const;

/** Hover lift for the whole pair. */
const LIFT = { type: "spring", stiffness: 420, damping: 28 } as const;

/**
 * Hover runs as a chain, not one simultaneous change:
 *   1. the accent disc swells to swallow its own ring,
 *   2. only then does the accent wash leftward across the label capsule,
 *   3. the label flips once the wash is under it,
 *   4. the arrow darts out and back while the wash travels.
 * Leaving hover reverses everything at once, quickly.
 */
const CTA_FILL = 0.22;
const CTA_WASH = 0.38;

/** The lit top rim that sells glass. Kept through hover so both halves keep their edge. */
const LIP = "inset 0 1px 0 color-mix(in oklab, var(--on-solid) 30%, transparent)";

const TONES = {
  glass: {
    pill: "color-mix(in oklab, var(--ink) 72%, transparent)",
    accent: "var(--lime)",
    /** The surface the disc sits on, so its ring reads as background showing through. */
    ringOn: "color-mix(in oklab, var(--ink) 72%, transparent)",
    labelRest: "var(--on-solid)",
    labelHover: "var(--on-lime)",
    arrow: "var(--on-lime)",
    blur: "backdrop-blur-md",
    focus: "var(--ink)",
  },
  sheet: {
    pill: "color-mix(in oklab, var(--on-solid) 8%, transparent)",
    accent: "var(--on-solid)",
    ringOn: "var(--ink)",
    labelRest: "var(--on-solid)",
    labelHover: "var(--ink)",
    arrow: "var(--ink)",
    blur: "",
    focus: "var(--on-solid)",
  },
} as const;

/**
 * The disc is permanently accent-coloured with its ring drawn as an inset
 * shadow that shrinks to nothing: one antialiased edge, so no dark hairline
 * can peek out from under it. The ring width travels as a CSS variable so the
 * shadow's colour can stay a theme token.
 */
const disc: Variants = {
  rest: { "--cta-ring": "3px", transition: { duration: 0.25, ease: EASE } },
  hover: { "--cta-ring": "0px", transition: { duration: CTA_FILL, ease: EASE } },
};

/** Resting glass fades once the wash has arrived, so no dark pixels bleed at the rim. */
const underlay: Variants = {
  rest: { opacity: 1, transition: { duration: 0.2 } },
  hover: { opacity: 0, transition: { duration: CTA_WASH, delay: CTA_FILL } },
};

/**
 * The wash block is twice the pill's width, anchored at its right edge, and
 * settles 20% past the left edge rather than flush: flush, two independently
 * antialiased curves leave a hairline at the arc. Travel is a transform, which
 * composites on the GPU, rather than `left`, which Safari stutters on behind
 * the pill's backdrop blur.
 */
function washVariants(reduce: boolean): Variants {
  return {
    rest: { x: "0%", transition: { duration: reduce ? 0 : 0.28, ease: EASE, type: "tween" } },
    hover: {
      x: "-60%",
      transition: reduce
        ? { duration: 0 }
        : { duration: CTA_WASH, ease: EASE, delay: CTA_FILL, type: "tween" },
    },
  };
}

/** The label's colour is a mix between its two tokens; the mix is what animates. */
const label: Variants = {
  rest: { "--cta-label": "0%", transition: { duration: 0.2 } },
  hover: { "--cta-label": "100%", transition: { duration: 0.18, delay: CTA_FILL + 0.1 } },
};

/**
 * The arrow exits right, then re-enters from the left. The jump happens while
 * it is outside the disc, which clips it, so the eye reads one arrow
 * travelling through. `travel` clears half the disc plus half the icon. The
 * small pair fires on the hover frame: at nav scale the wait reads as lag.
 */
function arrowVariants(travel: number, delay: number, reduce: boolean): Variants {
  if (reduce) return { rest: { x: 0 }, hover: { x: 0 } };
  return {
    rest: { x: 0, transition: { duration: 0.25, ease: EASE, type: "tween" } },
    hover: {
      x: [0, travel, -travel, 0],
      transition: {
        type: "tween",
        duration: delay ? 0.7 : 0.6,
        delay,
        times: [0, 0.45, 0.4501, 1],
        ease: EASE,
      },
    },
  };
}

/**
 * The two capsules: a label pill and a disc meeting at a single tangent point,
 * never merged into one shape. The lens-shaped slivers above and below where
 * they touch are the whole point; do not close the gap.
 */
function CtaBody({
  label: text,
  tone,
  size,
  reduce,
}: {
  label: React.ReactNode;
  tone: CtaTone;
  size: CtaSize;
  reduce: boolean;
}) {
  const t = TONES[tone];
  const large = size === "lg";
  const arrow = arrowVariants(large ? 26 : 22, large ? CTA_FILL : 0, reduce);

  return (
    <>
      {/* The blur lives on the underlay, not the pill: WebKit fails to paint a
          transformed child inside a backdrop-filter element, which made the
          wash vanish on Safari. */}
      <span
        className={cn(
          "relative flex items-center overflow-hidden rounded-full ring-1 ring-on-solid/25",
          large ? "h-10 px-6" : "h-9 px-4 sm:px-5",
        )}
        style={{ boxShadow: LIP }}
      >
        <motion.span
          aria-hidden="true"
          variants={underlay}
          className={cn("pointer-events-none absolute inset-0 rounded-full", t.blur)}
          style={{ backgroundColor: t.pill }}
        />
        {/* Only the rounded leading edge is ever on screen. The 2px vertical
            bleed is load-bearing. */}
        <motion.span
          aria-hidden="true"
          variants={washVariants(reduce)}
          className="absolute -inset-y-[2px] left-full block w-[200%] rounded-l-full"
          style={{ backgroundColor: t.accent }}
        />
        <motion.span
          variants={label}
          className={cn(
            "relative z-10 font-body font-medium whitespace-nowrap",
            large ? "text-sm" : "text-xs sm:text-sm",
          )}
          style={{
            color: `color-mix(in oklab, ${t.labelHover} var(--cta-label, 0%), ${t.labelRest})`,
          }}
        >
          {text}
        </motion.span>
      </span>

      {/* overflow-hidden sells the arrow's loop-through: it vanishes at the rim
          instead of drifting outside the circle. */}
      <motion.span
        variants={disc}
        className={cn(
          "relative flex items-center justify-center overflow-hidden rounded-full",
          large ? "size-10" : "size-9",
        )}
        style={{
          backgroundColor: t.accent,
          color: t.arrow,
          boxShadow: `inset 0 0 0 var(--cta-ring, 3px) ${t.ringOn}, ${LIP}`,
        }}
      >
        <motion.span variants={arrow} className="flex">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={large ? "size-4" : "size-[15px]"}
            aria-hidden="true"
          >
            <path d="M5 12h14" />
            <path d="m13 6 6 6-6 6" />
          </svg>
        </motion.span>
      </motion.span>
    </>
  );
}

/** On a touch screen the hit area grows to at least 44px without changing the look. */
const shell =
  "relative inline-flex cursor-pointer items-center focus-visible:outline-2 focus-visible:outline-offset-4 pointer-coarse:after:absolute pointer-coarse:after:top-1/2 pointer-coarse:after:left-1/2 pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 pointer-coarse:after:-translate-1/2 pointer-coarse:after:content-['']";

export interface CtaButtonProps {
  /** Label on the pill. Defaults to "Get Started". */
  label?: React.ReactNode;
  tone?: CtaTone;
  size?: CtaSize;
  /** Given, the CTA renders as an `<a>`; otherwise as a `<button>`. */
  href?: string;
  /** Button only. Defaults to "submit": the one action per form that submits it. */
  type?: "submit" | "button";
  /** Button only. Drops the hover chain entirely rather than running it on a dimmed capsule. */
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLElement>;
  /** Accessible name, when the label alone is not enough. */
  "aria-label"?: string;
  "aria-describedby"?: string;
  className?: string;
}

/**
 * The signature call to action: a label pill and an accent disc touching at
 * one point. On hover the pair lifts, the disc swallows its ring, the accent
 * washes across the label, and the arrow loops through the disc. As a link
 * with `href`, as a button without.
 */
export function CtaButton({
  label: text = "Get Started",
  tone = "glass",
  size = "lg",
  href,
  type = "submit",
  disabled = false,
  onClick,
  className,
  ...aria
}: CtaButtonProps) {
  const reduce = useReducedMotionConfig() ?? false;
  const live = href !== undefined || !disabled;
  const tap = size === "lg" ? 0.97 : 0.96;

  const motionProps = {
    initial: "rest",
    animate: "rest",
    whileHover: live ? "hover" : undefined,
    whileTap: live && !reduce ? { scale: tap } : undefined,
    variants: { rest: { y: 0 }, hover: { y: reduce ? 0 : -2 } },
    transition: LIFT,
    style: { outlineColor: TONES[tone].focus },
  } as const;

  const body = <CtaBody label={text} tone={tone} size={size} reduce={reduce} />;

  if (href !== undefined) {
    return (
      <motion.a href={href} onClick={onClick} className={cn(shell, className)} {...aria} {...motionProps}>
        {body}
      </motion.a>
    );
  }

  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(shell, "disabled:cursor-not-allowed disabled:opacity-60", className)}
      {...aria}
      {...motionProps}
    >
      {body}
    </motion.button>
  );
}

export default CtaButton;
