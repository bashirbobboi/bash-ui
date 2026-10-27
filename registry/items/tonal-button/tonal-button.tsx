"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export interface TonalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** The label. Defaults to "Earnings". */
  label?: React.ReactNode;
  /**
   * Fill. `tonal` is the quiet tinted fill (Steeze's blue-slate Earnings
   * button); `secondary` is the neutral one beside it (Edit Profile).
   */
  tone?: "tonal" | "secondary";
}

const TONE = {
  tonal: "bg-tonal px-8 text-on-tonal",
  secondary: "bg-secondary px-6 text-secondary-foreground",
} as const;

/**
 * A filled secondary action: Steeze's profile pair, Earnings and Edit Profile,
 * that sits beside a primary action without competing with it. It dims while
 * pressed, as a native touchable does.
 */
export function TonalButton({
  label = "Earnings",
  tone = "tonal",
  className,
  type = "button",
  ...props
}: TonalButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex cursor-pointer touch-manipulation items-center justify-center rounded-inset py-2 font-body text-base leading-6 font-semibold transition-opacity duration-150 select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none active:opacity-20 motion-reduce:transition-none disabled:pointer-events-none disabled:opacity-50",
        TONE[tone],
        className,
      )}
      {...props}
    >
      {label}
    </button>
  );
}

export default TonalButton;
