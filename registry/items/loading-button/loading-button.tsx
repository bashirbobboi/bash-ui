"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotionConfig } from "motion/react";
import { RefreshCw, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/** What an action may report back. Return nothing to mean "it worked". */
export type ActionOutcome = { ok: boolean; message?: string };

export interface LoadingButtonProps {
  /** The work. Resolve to report success, reject or return `{ ok: false }` to report failure. */
  onAction: () => Promise<ActionOutcome | void>;
  /** The resting label: what pressing it will do. */
  label: React.ReactNode;
  /** Shown while the action runs. Defaults to "Working…". */
  pendingLabel?: React.ReactNode;
  /** Shown beside the button after success, unless the action returns its own message. */
  successLabel?: React.ReactNode;
  /** Shown beside the button after failure, unless the action returns its own message. */
  errorLabel?: React.ReactNode;
  /** The icon; it spins while the action runs. Defaults to a refresh arrow. */
  icon?: LucideIcon;
  disabled?: boolean;
  className?: string;
}

/**
 * A compact solid button for one on-demand job: fetch, refresh, re-check.
 * Pressed, it spins its icon and swaps to a pending label; settled, it says
 * how it went in a short status line beside it, in the go or stop colour.
 *
 * For work the user asks for *now*. If the page needs the data to render,
 * fetch it on the page instead; a button is the override, not the plumbing.
 */
export function LoadingButton({
  onAction,
  label,
  pendingLabel = "Working…",
  successLabel = "Done",
  errorLabel = "That did not work. Try again.",
  icon: Icon = RefreshCw,
  disabled = false,
  className,
}: LoadingButtonProps) {
  const reduceMotion = useReducedMotionConfig();
  const [pending, startTransition] = React.useTransition();
  const [result, setResult] = React.useState<{
    ok: boolean;
    message: React.ReactNode;
  } | null>(null);

  function run() {
    setResult(null);
    startTransition(async () => {
      try {
        const outcome = await onAction();
        const ok = outcome ? outcome.ok : true;
        setResult({
          ok,
          message: outcome?.message ?? (ok ? successLabel : errorLabel),
        });
      } catch {
        setResult({ ok: false, message: errorLabel });
      }
    });
  }

  return (
    // The status line hangs off the button's left edge instead of sitting in
    // the row, so the button never moves when a result appears or clears.
    <div
      className={cn("relative inline-flex items-center font-body", className)}
    >
      <span className="pointer-events-none absolute inset-y-0 right-full flex items-center pr-2">
        <AnimatePresence mode="wait" initial={false}>
          {result && (
            <motion.p
              key={result.ok ? "ok" : "error"}
              role="status"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: reduceMotion ? 0.1 : 0.2,
                ease: "easeOut",
              }}
              className={cn(
                "text-xs font-semibold whitespace-nowrap",
                result.ok ? "text-go" : "text-stop",
              )}
            >
              {result.message}
            </motion.p>
          )}
        </AnimatePresence>
      </span>

      <button
        type="button"
        onClick={run}
        disabled={disabled || pending}
        aria-busy={pending || undefined}
        className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-inset border border-lead bg-lead px-2.5 py-1 text-[12px] font-medium text-on-solid transition-colors hover:bg-lead-mid focus-visible:ring-2 focus-visible:ring-lead/30 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
      >
        <Icon
          aria-hidden="true"
          className={cn(
            "size-3 text-on-solid",
            pending && !reduceMotion && "animate-spin",
          )}
        />
        {pending ? pendingLabel : label}
      </button>
    </div>
  );
}
