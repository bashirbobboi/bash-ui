"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotionConfig } from "motion/react";
import { Check, Loader2, Trash2, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useThanosSnap } from "./thanos-snap-effect";

export type DeleteButtonSize = "xs" | "sm" | "md" | "lg";
/** `solid`: a filled destructive button. `subtle`: a washed one that sits quietly inside a card. */
export type DeleteButtonVariant = "solid" | "subtle";

export interface DeleteButtonProps {
  /** Resting label. Defaults to "Delete". */
  label?: React.ReactNode;
  /** Label once armed. Defaults to "Confirm". */
  confirmLabel?: React.ReactNode;
  /** Label while the delete runs. Defaults to "Deleting…". */
  deletingLabel?: React.ReactNode;
  /** Milliseconds "Deleting…" holds before the snap starts. Defaults to 650. */
  deletingDuration?: number;
  /**
   * The delete. Runs alongside the snap; the button waits for both. Handle
   * your own failures inside it (show a message, then remount the button
   * through its `key`): the snap cannot know in advance that it will fail.
   */
  onConfirm?: () => void | Promise<void>;
  /** The user backed out, by the X, Escape, or the auto-reset timeout. */
  onCancel?: () => void;
  /** The button armed itself (Delete → Confirm). */
  onStartConfirm?: () => void;
  /**
   * The dissolve has finished. Unmount the deleted row here, not in
   * `onConfirm`: removing the element while the snap plays cuts it dead.
   */
  onComplete?: () => void;
  /** `onConfirm` threw. The button comes back idle. Without this, the error is rethrown. */
  onError?: (error: unknown) => void;
  /** Defaults to "solid". */
  variant?: DeleteButtonVariant;
  /** Defaults to "md". */
  size?: DeleteButtonSize;
  /** Dissolve to dust on confirm. Defaults to true; false makes it a plain two-step confirm. */
  snapOnConfirm?: boolean;
  /** Stay gone once done. Defaults to true; false returns it to idle. */
  vanishOnComplete?: boolean;
  disabled?: boolean;
  /** Holds the button disabled from outside, e.g. while a parent's request is in flight. */
  loading?: boolean;
  /** Milliseconds before an armed button disarms itself. 0 (the default) never does. */
  autoResetTimeout?: number;
  /** Classes for the row holding both buttons. */
  className?: string;
  /** Classes for the delete/confirm button. */
  buttonClassName?: string;
  /** Classes for the X. */
  cancelButtonClassName?: string;
  "aria-label"?: string;
  /** Defaults to "Cancel deletion". */
  cancelAriaLabel?: string;
}

/**
 * Every part of the confirm/cancel morph (button width, label swap, icon swap,
 * the X sliding in and out) runs on this one curve so the group reads as a
 * single continuous movement instead of a sequence of separate steps.
 */
const MORPH_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const MORPH_TRANSITION = { duration: 0.3, ease: MORPH_EASE };
const SWAP_TRANSITION = { duration: 0.22, ease: MORPH_EASE };

const sizeConfig = {
  xs: { button: "h-7 px-2.5 text-xs gap-1.5", iconSize: 13, cancelBtn: "h-7 min-w-[32px] px-2", gapPx: 6 },
  sm: { button: "h-8 px-3 text-xs font-medium gap-1.5", iconSize: 14, cancelBtn: "h-8 min-w-[38px] px-2.5", gapPx: 6 },
  md: { button: "h-9 px-3.5 text-sm font-medium gap-2", iconSize: 16, cancelBtn: "h-9 min-w-[42px] px-3", gapPx: 8 },
  lg: { button: "h-10 px-4 text-sm font-semibold gap-2.5", iconSize: 18, cancelBtn: "h-10 min-w-[46px] px-3.5", gapPx: 10 },
} satisfies Record<DeleteButtonSize, { button: string; iconSize: number; cancelBtn: string; gapPx: number }>;

const CANCEL_STYLE =
  "bg-transparent text-dim hover:text-ink hover:bg-paper active:bg-paper-sunk border border-rule";
const COMMITTED_STYLE = "bg-stop text-on-solid shadow-xs border border-stop";

const variantStyles: Record<
  DeleteButtonVariant,
  { idle: string; confirming: string; deleting: string; cancel: string }
> = {
  solid: {
    idle: "bg-stop hover:bg-stop/90 active:bg-stop/80 text-on-solid shadow-xs border border-stop",
    confirming:
      "bg-stop hover:bg-stop/90 active:bg-stop/80 text-on-solid shadow-xs ring-2 ring-stop/20 border border-stop",
    deleting: COMMITTED_STYLE,
    cancel: CANCEL_STYLE,
  },
  subtle: {
    idle: "bg-stop-wash hover:bg-stop/15 active:bg-stop/20 text-stop border border-stop/25",
    confirming: "bg-stop hover:bg-stop/90 active:bg-stop/80 text-on-solid shadow-xs border border-stop",
    deleting: COMMITTED_STYLE,
    cancel: CANCEL_STYLE,
  },
};

type Status = "idle" | "confirming" | "deleting" | "snapping" | "vanished";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * A two-step delete that ends in a Thanos snap.
 *
 * 1. Idle: "Delete" with a trash can.
 * 2. Pressed: it arms — "Confirm" with a tick — and an X slides out beside it.
 *    The X, Escape, or the optional timeout disarm it.
 * 3. Confirmed: "Deleting…" with a spinner for a beat, then the button
 *    dissolves to dust while `onConfirm` runs, and stays gone.
 *
 * The button dissolves itself. To take the row with it, remove the row in
 * `onComplete` (fold its height away), or wrap the row in `ThanosSnapEffect`
 * and snap that from `onConfirm` with `snapOnConfirm={false}`.
 */
export const DeleteButton = React.forwardRef<HTMLButtonElement, DeleteButtonProps>(
  function DeleteButton(
    {
      label = "Delete",
      confirmLabel = "Confirm",
      deletingLabel = "Deleting…",
      deletingDuration = 650,
      onConfirm,
      onCancel,
      onStartConfirm,
      onComplete,
      onError,
      variant = "solid",
      size = "md",
      snapOnConfirm = true,
      vanishOnComplete = true,
      disabled = false,
      loading: externalLoading = false,
      autoResetTimeout = 0,
      className,
      buttonClassName,
      cancelButtonClassName,
      "aria-label": ariaLabelProp,
      cancelAriaLabel = "Cancel deletion",
    },
    ref,
  ) {
    const reduceMotion = useReducedMotionConfig();
    const [status, setStatus] = React.useState<Status>("idle");
    const [internalLoading, setInternalLoading] = React.useState(false);
    const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const { scope, targetRef, filterStyle, filter, snap, reset } = useThanosSnap({
      duration: 0.65,
      opacityStart: 0.45,
    });

    const isConfirming = status === "confirming";
    const isDeleting = status === "deleting";
    const isSnapping = status === "snapping";
    const isExecuting = externalLoading || internalLoading || isDeleting || isSnapping;
    /**
     * Once the user commits, "deleting" and "snapping" must render
     * *identically*. The dissolve has to eat the exact frame that was already
     * on screen — if any style, icon or label branch told the two apart, the
     * button would visibly revert at the instant the snap begins and the dust
     * would be made of the reverted frame.
     */
    const isCommitted = isDeleting || isSnapping;

    const currentSize = sizeConfig[size] ?? sizeConfig.md;
    const currentVariant = variantStyles[variant] ?? variantStyles.solid;

    const clearTimer = React.useCallback(() => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }, []);

    React.useEffect(() => clearTimer, [clearTimer]);

    React.useEffect(() => {
      if (!isConfirming || autoResetTimeout <= 0) return;
      clearTimer();
      timerRef.current = setTimeout(() => {
        setStatus("idle");
        onCancel?.();
      }, autoResetTimeout);
      return clearTimer;
    }, [isConfirming, autoResetTimeout, clearTimer, onCancel]);

    React.useEffect(() => {
      if (!isConfirming) return;
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        clearTimer();
        setStatus("idle");
        onCancel?.();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isConfirming, clearTimer, onCancel]);

    const finish = () => {
      setStatus(vanishOnComplete ? "vanished" : "idle");
      if (!vanishOnComplete) reset();
      setInternalLoading(false);
      onComplete?.();
    };

    const fail = (error: unknown) => {
      reset();
      setStatus("idle");
      setInternalLoading(false);
      if (onError) onError(error);
      else throw error;
    };

    const handlePrimaryClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      if (disabled || isExecuting || status === "vanished") return;

      if (!isConfirming) {
        setStatus("confirming");
        onStartConfirm?.();
        return;
      }

      clearTimer();
      setInternalLoading(true);
      setStatus("deleting");

      if (!snapOnConfirm) {
        try {
          await onConfirm?.();
        } catch (error) {
          fail(error);
          return;
        }
        finish();
        return;
      }

      if (deletingDuration > 0) await wait(deletingDuration);
      setStatus("snapping");
      // Let both settle: a rejected delete must not leave the button frozen
      // half-dissolved. It finishes its snap, then comes back idle.
      const [, outcome] = await Promise.allSettled([
        snap(),
        Promise.resolve().then(() => onConfirm?.()),
      ]);
      if (outcome.status === "rejected") {
        fail(outcome.reason);
        return;
      }
      finish();
    };

    const handleCancelClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      if (disabled || isExecuting) return;
      clearTimer();
      setStatus("idle");
      onCancel?.();
    };

    if (status === "vanished") return null;

    const buttonStyleClasses = isCommitted
      ? currentVariant.deleting
      : isConfirming
        ? currentVariant.confirming
        : currentVariant.idle;

    // Icons turn as they swap; under reduced motion they only cross-fade.
    const iconMotion = (turn: number, from: number) =>
      reduceMotion
        ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
        : {
            initial: { opacity: 0, scale: from, rotate: -turn },
            animate: { opacity: 1, scale: 1, rotate: 0 },
            exit: { opacity: 0, scale: from, rotate: turn },
          };
    const labelMotion = reduceMotion
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
      : { initial: { opacity: 0, y: 5 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -5 } };

    return (
      <div ref={scope} className="relative inline-block">
        <div ref={targetRef} style={filterStyle} className="will-change-transform">
          <div className={cn("inline-flex select-none items-center", className)}>
            <motion.button
              ref={ref}
              type="button"
              onClick={handlePrimaryClick}
              disabled={disabled || isExecuting}
              aria-label={
                ariaLabelProp ||
                (isConfirming ? "Confirm deletion" : isExecuting ? "Deleting item" : "Delete item")
              }
              aria-expanded={isConfirming}
              aria-live="polite"
              whileTap={disabled || isExecuting || reduceMotion ? undefined : { scale: 0.97 }}
              className={cn(
                "relative inline-flex cursor-pointer items-center justify-center overflow-hidden rounded-sm font-body font-medium tracking-tight transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stop/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none",
                // The button disables itself while deleting, so a blanket
                // `disabled:opacity-50` would run the whole dissolve at half
                // opacity and wash the dust out. Only dim a genuinely
                // disabled control.
                disabled && !isExecuting && "opacity-50",
                currentSize.button,
                buttonStyleClasses,
                buttonClassName,
              )}
            >
              {/* Trash → tick → spinner */}
              <span className="relative flex shrink-0 items-center justify-center">
                <AnimatePresence mode="popLayout" initial={false}>
                  {isCommitted ? (
                    <motion.span
                      key="loading-icon"
                      {...iconMotion(45, 0.7)}
                      transition={SWAP_TRANSITION}
                      className="flex items-center justify-center"
                    >
                      <Loader2 size={currentSize.iconSize} className="animate-spin" aria-hidden="true" />
                    </motion.span>
                  ) : isConfirming ? (
                    <motion.span
                      key="confirm-tick-icon"
                      {...iconMotion(20, 0.6)}
                      transition={SWAP_TRANSITION}
                      className="flex items-center justify-center"
                    >
                      <Check size={currentSize.iconSize} strokeWidth={2.5} aria-hidden="true" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="delete-trash-icon"
                      {...iconMotion(-20, 0.6)}
                      transition={SWAP_TRANSITION}
                      className="flex items-center justify-center"
                    >
                      <Trash2 size={currentSize.iconSize} strokeWidth={2} aria-hidden="true" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>

              {/* Delete → Confirm → Deleting… */}
              <span className="relative inline-grid items-center justify-items-center overflow-hidden">
                {/* The executing label is usually the longest of the three, so
                    it gets its own sizer that grows in on the shared curve
                    instead of padding out the resting button. The grid column
                    tracks the widest item, so animating this one animates the
                    button. */}
                <AnimatePresence initial={false}>
                  {isCommitted && (
                    <motion.span
                      key="executing-sizer"
                      aria-hidden="true"
                      initial={{ width: 0 }}
                      animate={{ width: "auto" }}
                      exit={{ width: 0 }}
                      transition={MORPH_TRANSITION}
                      className="invisible col-start-1 row-start-1 overflow-hidden whitespace-nowrap font-semibold"
                    >
                      {deletingLabel}
                    </motion.span>
                  )}
                </AnimatePresence>
                {/* Invisible sizers hold the column at the wider of the two
                    resting labels, so swapping between them never resizes the
                    button or nudges the row around it. */}
                {[label, confirmLabel].map((sizerLabel, index) => (
                  <span
                    key={`label-sizer-${index}`}
                    aria-hidden="true"
                    className="invisible col-start-1 row-start-1 whitespace-nowrap font-semibold"
                  >
                    {sizerLabel}
                  </span>
                ))}
                <span className="absolute inset-0 flex items-center justify-center">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {isCommitted ? (
                      <motion.span
                        key="deleting-text"
                        {...labelMotion}
                        transition={SWAP_TRANSITION}
                        className="whitespace-nowrap font-medium"
                      >
                        {deletingLabel}
                      </motion.span>
                    ) : isConfirming ? (
                      <motion.span
                        key="confirming-text"
                        {...labelMotion}
                        transition={SWAP_TRANSITION}
                        className="whitespace-nowrap font-semibold"
                      >
                        {confirmLabel}
                      </motion.span>
                    ) : (
                      <motion.span
                        key="idle-text"
                        {...labelMotion}
                        transition={SWAP_TRANSITION}
                        className="whitespace-nowrap"
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
              </span>
            </motion.button>

            {/* The X: slides out beside Confirm, folds back on cancel. */}
            <AnimatePresence initial={false}>
              {isConfirming && !isExecuting && (
                <motion.div
                  key="cancel-x-button"
                  initial={{ width: 0, marginLeft: 0, opacity: 0 }}
                  animate={{ width: "auto", marginLeft: currentSize.gapPx, opacity: 1 }}
                  exit={{ width: 0, marginLeft: 0, opacity: 0 }}
                  transition={MORPH_TRANSITION}
                  className="shrink-0 overflow-hidden"
                >
                  <motion.button
                    type="button"
                    whileTap={reduceMotion ? undefined : { scale: 0.92 }}
                    onClick={handleCancelClick}
                    disabled={disabled || isExecuting}
                    aria-label={cancelAriaLabel}
                    title="Cancel"
                    className={cn(
                      "relative inline-flex shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-faint focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
                      currentSize.cancelBtn,
                      currentVariant.cancel,
                      cancelButtonClassName,
                    )}
                  >
                    <X size={currentSize.iconSize} strokeWidth={2.2} aria-hidden="true" />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        {filter}
      </div>
    );
  },
);

DeleteButton.displayName = "DeleteButton";

/** The same component under the name some screens import it by. */
export const DeleteConfirmButton = DeleteButton;
export type DeleteConfirmButtonProps = DeleteButtonProps;
