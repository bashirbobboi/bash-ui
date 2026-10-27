"use client";

import * as React from "react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import {
  motion,
  useReducedMotionConfig,
  type HTMLMotionProps,
} from "motion/react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * A checkbox whose tick draws itself in. Radix underneath (keyboard, form
 * value, `indeterminate`), a motion button on top: it grows a touch on hover,
 * dips on press, and the check stroke traces from nothing once the fill has
 * landed. Checked is the theme's `lead`, never a brand green.
 *
 * It renders a `<button>`, so pair it with `<label htmlFor>` pointing at its
 * `id`; wrapping it in a label is not enough for every screen reader.
 */

const checkboxVariants = cva(
  [
    "peer flex shrink-0 items-center justify-center border border-rule bg-card text-on-solid outline-none",
    "transition-colors duration-500",
    "focus-visible:ring-2 focus-visible:ring-lead/30 focus-visible:ring-offset-2 focus-visible:ring-offset-card",
    "aria-invalid:border-stop aria-invalid:ring-2 aria-invalid:ring-stop/20",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "data-[state=checked]:border-lead data-[state=checked]:bg-lead",
    "data-[state=indeterminate]:border-lead data-[state=indeterminate]:bg-lead",
    // A 44px hit area on a touch screen; the box itself stays small.
    "pointer-coarse:relative pointer-coarse:after:absolute pointer-coarse:after:top-1/2 pointer-coarse:after:left-1/2 pointer-coarse:after:size-[max(100%,44px)] pointer-coarse:after:-translate-x-1/2 pointer-coarse:after:-translate-y-1/2 pointer-coarse:after:content-['']",
  ],
  {
    variants: {
      size: {
        sm: "size-4.5 rounded-[calc(var(--inset-radius)-1px)]",
        default: "size-5 rounded-[calc(var(--inset-radius)-1px)]",
        lg: "size-6 rounded-inset",
      },
    },
    defaultVariants: { size: "sm" },
  },
);

const indicatorSizes = {
  sm: "size-3",
  default: "size-3.5",
  lg: "size-4",
} as const;

type CheckedState = boolean | "indeterminate";

export type CheckboxProps = Omit<
  HTMLMotionProps<"button">,
  "value" | "checked" | "defaultChecked"
> &
  Omit<
    React.ComponentProps<typeof CheckboxPrimitive.Root>,
    "asChild" | keyof HTMLMotionProps<"button">
  > &
  VariantProps<typeof checkboxVariants> & {
    checked?: CheckedState;
    defaultChecked?: CheckedState;
    onCheckedChange?: (checked: CheckedState) => void;
    value?: string;
  };

export function Checkbox({
  className,
  size,
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  required,
  name,
  value,
  ...props
}: CheckboxProps) {
  const reduceMotion = useReducedMotionConfig();
  const [inner, setInner] = React.useState<CheckedState>(defaultChecked ?? false);
  const isChecked = checked !== undefined ? checked : inner;

  function handleChange(next: CheckedState) {
    setInner(next);
    onCheckedChange?.(next);
  }

  return (
    <CheckboxPrimitive.Root
      checked={isChecked}
      onCheckedChange={handleChange}
      disabled={disabled}
      required={required}
      name={name}
      value={value}
      asChild
    >
      <motion.button
        data-slot="checkbox"
        whileTap={reduceMotion ? undefined : { scale: 0.95 }}
        whileHover={reduceMotion ? undefined : { scale: 1.05 }}
        className={cn(checkboxVariants({ size }), className)}
        {...props}
      >
        <CheckboxPrimitive.Indicator forceMount asChild>
          <motion.svg
            data-slot="checkbox-indicator"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="3.5"
            stroke="currentColor"
            aria-hidden="true"
            className={indicatorSizes[size ?? "sm"]}
            initial="unchecked"
            animate={isChecked ? "checked" : "unchecked"}
          >
            {isChecked === "indeterminate" ? (
              <motion.line
                x1="5"
                y1="12"
                x2="19"
                y2="12"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{
                  pathLength: 1,
                  opacity: 1,
                  transition: { duration: reduceMotion ? 0 : 0.2 },
                }}
              />
            ) : (
              <motion.path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
                variants={{
                  checked: {
                    pathLength: 1,
                    opacity: 1,
                    transition: reduceMotion
                      ? { duration: 0 }
                      : { duration: 0.2, delay: 0.2 },
                  },
                  unchecked: {
                    pathLength: 0,
                    opacity: 0,
                    transition: { duration: reduceMotion ? 0 : 0.2 },
                  },
                }}
              />
            )}
          </motion.svg>
        </CheckboxPrimitive.Indicator>
      </motion.button>
    </CheckboxPrimitive.Root>
  );
}
