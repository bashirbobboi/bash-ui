"use client";

import * as React from "react";
import { motion, useReducedMotionConfig, type Variants } from "motion/react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export interface SendButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** The resting label. Defaults to "Send". */
  label?: React.ReactNode;
  /** Optional leading icon, shown before the plane. */
  icon?: LucideIcon;
  /** Swaps the label for `pendingLabel`, holds the plane still and blocks input. */
  pending?: boolean;
  /** Label shown while `pending`. Defaults to "Sending…". */
  pendingLabel?: React.ReactNode;
  /**
   * Surface. `ink` is translucent charcoal glass; `lead` is the structural
   * accent, for placements sitting on light glass where ink reads as a hole.
   */
  tone?: "ink" | "lead";
  /** Corners. `pill` is fully rounded; `lg` squares off to the theme radius. */
  radius?: "pill" | "lg";
}

const FLY = { duration: 0.3, ease: "easeOut" } as const;

/** The plane's wrapper bobs while hovered; it settles when the pointer leaves. */
const bob: Variants = {
  rest: { y: 0, transition: { duration: 0.2, ease: "easeOut" } },
  hover: {
    y: ["0.1em", "-0.1em"],
    transition: {
      duration: 0.6,
      ease: "easeInOut",
      repeat: Infinity,
      repeatType: "reverse",
    },
  },
};

/** The plane itself turns to face its heading and drifts into the label's place. */
const flight: Variants = {
  rest: { x: 0, rotate: 0, scale: 1, transition: FLY },
  hover: { x: "1.2em", rotate: 45, scale: 1.1, transition: FLY },
};

/** The label slides out behind the button's clipped right edge. */
const slide: Variants = {
  rest: { x: 0, transition: FLY },
  hover: { x: "5em", transition: FLY },
};

/**
 * The send action: a button whose paper plane flies forward as the label
 * slides out behind it. Spend it on the one real "this leaves the building"
 * moment on a screen; the effect only means something if it is rare.
 *
 * It has a pending state because sending is a round trip that can fail: while
 * `pending`, the label reads `pendingLabel`, the plane holds still and the
 * button refuses presses.
 */
export function SendButton({
  label = "Send",
  icon: Icon,
  pending = false,
  pendingLabel = "Sending…",
  tone = "ink",
  radius = "pill",
  className,
  type = "button",
  disabled,
  onMouseEnter,
  onMouseLeave,
  ...props
}: SendButtonProps) {
  const reduceMotion = useReducedMotionConfig();
  const [hovered, setHovered] = React.useState(false);

  // Mid-send the plane holds still under the pending label, and reduced motion
  // keeps it still always.
  const state = hovered && !pending && !disabled && !reduceMotion ? "hover" : "rest";

  return (
    <button
      type={type}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      data-pending={pending ? "" : undefined}
      onMouseEnter={(event) => {
        setHovered(true);
        onMouseEnter?.(event);
      }}
      onMouseLeave={(event) => {
        setHovered(false);
        onMouseLeave?.(event);
      }}
      className={cn(
        "relative inline-flex h-10 cursor-pointer touch-manipulation items-center justify-center gap-2 overflow-hidden px-5 font-body text-sm font-semibold tracking-[-0.02em] text-on-solid shadow-[inset_0_1px_0_color-mix(in_oklab,var(--on-solid)_30%,transparent)] ring-1 backdrop-blur-md transition-colors duration-200 select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        tone === "lead"
          ? "bg-lead ring-on-solid/20 hover:bg-lead-mid"
          : "bg-ink/85 ring-on-solid/25 hover:bg-ink",
        radius === "lg" ? "rounded-lg" : "rounded-full",
        className,
      )}
      {...props}
    >
      {Icon && <Icon aria-hidden="true" className="size-4 shrink-0" />}
      <motion.span
        aria-hidden="true"
        className="flex items-center"
        variants={bob}
        initial={false}
        animate={state}
      >
        <motion.svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          width={20}
          height={20}
          className="origin-center"
          variants={flight}
          initial={false}
          animate={state}
        >
          <path
            fill="currentColor"
            d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z"
          />
        </motion.svg>
      </motion.span>
      <motion.span
        className={cn("block", Icon && "ml-2")}
        variants={slide}
        initial={false}
        animate={state}
      >
        {pending ? pendingLabel : label}
      </motion.span>
    </button>
  );
}

export default SendButton;
