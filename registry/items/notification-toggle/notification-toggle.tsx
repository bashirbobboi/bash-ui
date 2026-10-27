"use client";

import type { InputHTMLAttributes, Ref } from "react";
import { useReducedMotionConfig } from "motion/react";

import { cn } from "@/lib/utils";

export interface NotificationToggleProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange" | "size" | "role"> {
  ref?: Ref<HTMLInputElement>;
  onCheckedChange?: (checked: boolean) => void;
}

/** Steeze's native SMS switch, adapted for the web. Supply an accessible name. */
export function NotificationToggle({
  ref,
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  className,
  style,
  ...props
}: NotificationToggleProps) {
  const reduceMotion = useReducedMotionConfig();

  return (
    <label
      className={cn(
        "relative inline-flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
      style={style}
    >
      <input
        {...props}
        ref={ref}
        type="checkbox"
        role="switch"
        className="peer sr-only"
        checked={checked}
        defaultChecked={defaultChecked}
        disabled={disabled}
        onChange={(event) => onCheckedChange?.(event.target.checked)}
      />
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none inline-flex h-[31px] w-[51px] items-center rounded-full bg-switch-track-off p-0.5 transition-colors duration-200 motion-reduce:transition-none",
          "peer-checked:bg-switch-track-on peer-checked:[&>span]:translate-x-5 peer-checked:[&>span]:bg-switch-thumb-on",
          "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-ring",
          reduceMotion && "transition-none",
        )}
      >
        <span
          className={cn(
            "block size-[27px] shrink-0 rounded-full bg-switch-thumb-off transition-[translate,background-color] duration-200 ease-out motion-reduce:transition-none",
            reduceMotion && "transition-none",
          )}
        />
      </span>
    </label>
  );
}
