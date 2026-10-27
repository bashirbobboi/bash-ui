"use client";

import * as React from "react";
import { useReducedMotionConfig } from "motion/react";
import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * `solid` is the hero pill: a primary fill whose dot blooms into the page
 * colour. `outline` is the navigation pill: a hairline whose dot blooms into
 * the primary fill. Each ends in the other's colours.
 */
export type ArrowButtonVariant = "solid" | "outline";

export type ArrowButtonSize = "sm" | "md" | "lg";

interface BaseProps {
  /** The label, at rest and again beside the arrow on hover. Defaults to "Download Now". */
  label?: React.ReactNode;
  variant?: ArrowButtonVariant;
  size?: ArrowButtonSize;
  className?: string;
}

type AnchorProps = BaseProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "children" | keyof BaseProps> & {
    /** Given, the pill renders as an `<a>`; otherwise as a `<button>`. */
    href: string;
  };

type ButtonProps = BaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children" | keyof BaseProps> & {
    href?: undefined;
  };

export type ArrowButtonProps = AnchorProps | ButtonProps;

/**
 * Every layer carries its own text colour rather than inheriting the shell's,
 * so a project's global `a` / `a:hover` / `a:visited` colours cannot repaint
 * the label when the pill is a link.
 */
const VARIANTS = {
  solid: {
    shell: "border-primary bg-primary",
    rest: "text-primary-foreground",
    dot: "bg-background",
    hover: "text-foreground",
  },
  outline: {
    shell: "border-foreground bg-transparent",
    rest: "text-foreground",
    dot: "bg-primary",
    hover: "text-primary-foreground",
  },
} as const;

const SIZES = {
  sm: "h-9 px-5 text-sm",
  md: "h-10 px-6 text-[15px]",
  lg: "h-12 px-8 text-base",
} as const;

const SHELL =
  "group/ihb relative inline-flex cursor-pointer touch-manipulation items-center justify-center overflow-hidden rounded-full border font-heading font-semibold whitespace-nowrap no-underline select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

/**
 * A pill whose small dot blooms to fill it on hover. The resting label slides
 * out to the right and fades while the same label returns beside an up-right
 * arrow in the inverted colours. An invisible copy of that hover row stays in
 * flow, so the pill is always as wide as its widest state and never jumps.
 *
 * Hover is hover-capable pointers only (Tailwind's `hover:` is gated on
 * `(hover: hover)`), so nothing sticks after a tap; keyboard focus plays the
 * same bloom. Reduced motion swaps the colours without the bloom or slide.
 */
export const ArrowButton = React.forwardRef<
  HTMLAnchorElement | HTMLButtonElement,
  ArrowButtonProps
>(function ArrowButton(
  { label = "Download Now", variant = "solid", size = "md", className, ...props },
  ref,
) {
  const reduce = useReducedMotionConfig() ?? false;
  const v = VARIANTS[variant];
  const timing = reduce ? "transition-none" : "duration-300 ease-out motion-reduce:transition-none";
  const classes = cn(SHELL, v.shell, SIZES[size], className);

  const body = (
    <>
      {/* In-flow sizer: as wide as the hover row, so the pill holds its width. */}
      <span aria-hidden="true" className="invisible flex shrink-0 items-center gap-2">
        <span>{label}</span>
        <ArrowUpRight className="size-4 shrink-0" />
      </span>

      {/* The resting label, nudged right of the dot where there is a dot to clear. */}
      <span
        className={cn(
          "absolute inset-0 z-[2] flex items-center justify-center transition-opacity group-hover/ihb:opacity-0 group-focus-visible/ihb:opacity-0",
          v.rest,
          timing,
        )}
      >
        <span className="inline-block pointer-fine:translate-x-2">
          <span
            className={cn(
              "inline-block transition-transform group-hover/ihb:translate-x-12 group-focus-visible/ihb:translate-x-12",
              timing,
            )}
          >
            {label}
          </span>
        </span>
      </span>

      {/* The hover row: the label again, with the arrow, in the bloom's colours. */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-0 z-[3] flex items-center justify-center gap-2 opacity-0 transition-opacity group-hover/ihb:opacity-100 group-focus-visible/ihb:opacity-100",
          v.hover,
          timing,
        )}
      >
        <span>{label}</span>
        <ArrowUpRight className="size-4 shrink-0" />
      </span>

      {/* The dot. Touch screens have no hover to bloom it, so they never see it. */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute top-1/2 left-[15%] z-[1] size-2 -translate-y-1/2 rounded-lg transition-all pointer-coarse:hidden",
          "group-hover/ihb:top-0 group-hover/ihb:left-0 group-hover/ihb:h-full group-hover/ihb:w-full group-hover/ihb:translate-y-0 group-hover/ihb:scale-[1.8]",
          "group-focus-visible/ihb:top-0 group-focus-visible/ihb:left-0 group-focus-visible/ihb:h-full group-focus-visible/ihb:w-full group-focus-visible/ihb:translate-y-0 group-focus-visible/ihb:scale-[1.8]",
          v.dot,
          timing,
        )}
      />
    </>
  );

  if (props.href !== undefined) {
    return (
      <a ref={ref as React.Ref<HTMLAnchorElement>} className={classes} {...(props as Omit<AnchorProps, keyof BaseProps>)}>
        {body}
      </a>
    );
  }

  const { type = "button", ...rest } = props as Omit<ButtonProps, keyof BaseProps>;
  return (
    <button ref={ref as React.Ref<HTMLButtonElement>} type={type} className={classes} {...rest}>
      {body}
    </button>
  );
});

export default ArrowButton;
