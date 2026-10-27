"use client";

import { useState, type MouseEventHandler } from "react";
import { motion, useReducedMotionConfig } from "motion/react";
import { cn } from "@/lib/utils";

export type KeyLoginButtonProps = {
  label?: string;
  href?: string;
  onClick?: MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>;
  disabled?: boolean;
  fullWidth?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
};

/** Ledge's rotating key and rolling label, as a link or an action button. */
export function KeyLoginButton({ label = "Log in", href, onClick, disabled = false, fullWidth = false, type = "button", className }: KeyLoginButtonProps) {
  const reducedMotion = useReducedMotionConfig();
  const [active, setActive] = useState(false);
  const moving = active && !disabled && !reducedMotion;
  const content = <>
    <motion.svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-4 shrink-0" animate={{ rotate: moving ? 45 : 0 }} transition={{ duration: reducedMotion ? 0 : 0.3, ease: "easeOut" }}>
      <circle cx="7" cy="17" r="5" />
      <line x1="10.5" y1="13.5" x2="21" y2="3" />
      <line x1="15" y1="9" x2="17.5" y2="11.5" />
      <line x1="18" y1="6" x2="20.5" y2="8.5" />
    </motion.svg>
    <span className="relative block overflow-hidden">
      <motion.span className="block" animate={{ y: moving ? "-100%" : "0%" }} transition={{ duration: reducedMotion ? 0 : 0.3, ease: "easeOut" }}>{label}</motion.span>
      <motion.span aria-hidden="true" className="absolute inset-0 block" initial={{ y: "100%" }} animate={{ y: moving ? "0%" : "100%" }} transition={{ duration: reducedMotion ? 0 : 0.3, ease: "easeOut" }}>{label}</motion.span>
    </span>
  </>;
  const classes = cn("inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 font-body text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lead motion-reduce:transition-none", fullWidth && "w-full", disabled && "pointer-events-none opacity-50", className);
  const events = {
    onPointerEnter: () => setActive(true),
    onPointerLeave: () => setActive(false),
    onFocus: () => setActive(true),
    onBlur: () => setActive(false),
  };
  return href
    ? <a {...events} href={disabled ? undefined : href} aria-disabled={disabled || undefined} tabIndex={disabled ? -1 : undefined} onClick={disabled ? (event) => event.preventDefault() : onClick} className={classes}>{content}</a>
    : <button {...events} type={type} disabled={disabled} onClick={onClick} className={classes}>{content}</button>;
}
