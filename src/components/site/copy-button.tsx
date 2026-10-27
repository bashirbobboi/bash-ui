"use client";

import { Check, Copy } from "lucide-react";
import { AnimatePresence, motion, useReducedMotionConfig } from "motion/react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Ghost } from "./ghost";

function useCopy(value: string) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked (insecure origin, permissions). Nothing useful to show.
    }
  }
  return { copied, copy };
}

/** The icon swap: copy fades out blurred and small, the tick fades in. */
export function CopyGlyph({ copied, className }: { copied: boolean; className?: string }) {
  const swap = "absolute inset-0 m-auto transition-[opacity,transform,filter] duration-200";
  return (
    <span className={cn("relative inline-block", className)}>
      <Copy className={cn(swap, "size-full", copied && "scale-[0.4] opacity-0 blur-[3px]")} />
      <Check className={cn(swap, "size-full", !copied && "scale-[0.4] opacity-0 blur-[3px]")} />
    </span>
  );
}

export function CopyButton({ value, className }: { value: string; className?: string }) {
  const { copied, copy } = useCopy(value);
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copied" : "Copy"}
      className={cn("site-chip grid size-8 shrink-0 place-items-center rounded-full text-ink", className)}
    >
      <CopyGlyph copied={copied} className="size-3.5" />
    </button>
  );
}

/** A labelled pill that copies: "Theme file", "CSS", "Link". */
export function CopyPill({ value, children }: { value: string; children: ReactNode }) {
  const { copied, copy } = useCopy(value);
  return (
    <button
      type="button"
      onClick={copy}
      className="site-raised inline-flex h-8 items-center gap-2 rounded-full px-3 text-[13px] leading-[14px] font-medium whitespace-nowrap text-ink transition-[background-color] hover:bg-paper-sunk"
    >
      <CopyGlyph copied={copied} className="size-3.5" />
      {copied ? "Copied" : children}
    </button>
  );
}

/**
 * For copies meant for an agent: the ghost pops up over the control and gets
 * to work for as long as `show` holds. Sits in a `relative` parent.
 */
export function PopGhost({ show }: { show: boolean }) {
  const reduce = useReducedMotionConfig();
  return (
    <span className="pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2">
      <AnimatePresence>
        {show ? (
          <motion.span
            className="block"
            initial={{ opacity: 0, y: reduce ? 0 : 10, scale: reduce ? 1 : 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: reduce ? 0 : 6, scale: reduce ? 1 : 0.7 }}
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 24 }}
          >
            <Ghost size={36} state="working" />
          </motion.span>
        ) : null}
      </AnimatePresence>
    </span>
  );
}
