"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotionConfig } from "motion/react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

import { FaceRating, type RatingLabels } from "./face-rating";

/**
 * A non-blocking card that asks how the experience is going.
 *
 * By default it floats at the bottom right of the viewport (a full-width strip
 * on a phone), beside the work rather than over it, and one click dismisses
 * it. The morphing face rating gives a 1–5 score; an optional comment sits
 * beneath it.
 *
 * After a send, the card holds a thank-you for `autoCloseMs` (or until the X),
 * then leaves. After a dismissal it leaves at once; whether and when to ask
 * again is the caller's decision, through `open`.
 *
 * Motion: the entrance is a blur-up rise, the exit reverses it.
 */

export type FeedbackSubmission = {
  /** 1–5. */
  rating: number;
  /** The mood name for the rating, e.g. "Good". */
  label: string;
  /** Trimmed; undefined when left empty. */
  comment?: string;
};

/**
 * Resolve with nothing (or `true`, or `{ ok: true }`) for success. Reject, or
 * resolve `false` or `{ ok: false }`, to keep the form up with an error line.
 */
export type FeedbackSubmitResult = void | boolean | { ok: boolean };

export type FeedbackCardProps = {
  /** Controlled visibility. Omit and use `defaultOpen` to let the card manage itself. */
  open?: boolean;
  /** Starting visibility when uncontrolled. Defaults to true. */
  defaultOpen?: boolean;
  /** Fires whenever the card closes (dismissed, closed after a send, or auto-closed). */
  onOpenChange?: (open: boolean) => void;
  /** Sends the rating. Without it the card goes straight to its thank-you. */
  onSubmit?: (feedback: FeedbackSubmission) => Promise<FeedbackSubmitResult> | FeedbackSubmitResult;
  /**
   * The person closed the card without sending ("Not now" or the X). Use it to
   * snooze the prompt. Awaited before the card leaves; not called after a send.
   */
  onDismiss?: () => Promise<void> | void;
  /** "fixed" floats bottom-right of the viewport; "inline" sits in the flow. Defaults to fixed. */
  position?: "fixed" | "inline";
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Mood names for ratings 1–5. */
  labels?: RatingLabels;
  placeholder?: string;
  /** Longest comment accepted. Defaults to 280. */
  maxLength?: number;
  submitLabel?: React.ReactNode;
  dismissLabel?: React.ReactNode;
  thankYouTitle?: React.ReactNode;
  thankYouMessage?: React.ReactNode;
  /** Shown when `onSubmit` fails. */
  errorMessage?: React.ReactNode;
  /** How long the thank-you stays before the card leaves, in ms. 0 keeps it up. Defaults to 5000. */
  autoCloseMs?: number;
  className?: string;
};

const EASE = [0.2, 0.7, 0.2, 1] as const;

export function FeedbackCard({
  open: openProp,
  defaultOpen = true,
  onOpenChange,
  position = "fixed",
  className,
  ...bodyProps
}: FeedbackCardProps) {
  const reduceMotion = useReducedMotionConfig();
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const open = openProp ?? internalOpen;

  const close = () => {
    if (openProp === undefined) setInternalOpen(false);
    onOpenChange?.(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={
            reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20, filter: "blur(8px)", scale: 0.97 }
          }
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, filter: "blur(6px)", scale: 0.97 }}
          transition={{ duration: 0.5, ease: EASE }}
          className={cn(
            position === "fixed"
              ? "fixed right-6 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] z-30 w-[340px] max-w-[calc(100vw-3rem)] max-sm:inset-x-3 max-sm:bottom-[calc(0.75rem+env(safe-area-inset-bottom))] max-sm:w-auto max-sm:max-w-none sm:w-[360px]"
              : "relative w-full max-w-[360px]",
            className,
          )}
        >
          {/* Remounts on every opening, so a reopened card starts blank. */}
          <FeedbackCardBody {...bodyProps} onClose={close} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

type BodyProps = Omit<
  FeedbackCardProps,
  "open" | "defaultOpen" | "onOpenChange" | "position" | "className"
> & { onClose: () => void };

const DEFAULT_LABELS: RatingLabels = ["Terrible", "Bad", "Okay", "Good", "Amazing"];

function isFailure(result: FeedbackSubmitResult) {
  return result === false || (typeof result === "object" && result !== null && !result.ok);
}

function FeedbackCardBody({
  onSubmit,
  onDismiss,
  onClose,
  title = "How’s your experience?",
  description = "Rate your experience so far.",
  labels = DEFAULT_LABELS,
  placeholder = "Anything else? (optional)",
  maxLength = 280,
  submitLabel = "Send feedback",
  dismissLabel = "Not now",
  thankYouTitle = "Thanks for your feedback!",
  thankYouMessage = "We’ll use it to make things better.",
  errorMessage = "That could not be sent. Try again.",
  autoCloseMs = 5000,
}: BodyProps) {
  const [rating, setRating] = React.useState(0);
  const [comment, setComment] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const dismissTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(
    () => () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    },
    [],
  );

  const handleSubmit = () => {
    if (rating === 0) return;
    setFailed(false);
    startTransition(async () => {
      let result: FeedbackSubmitResult;
      try {
        result = await onSubmit?.({
          rating,
          label: labels[rating - 1],
          comment: comment.trim() || undefined,
        });
      } catch {
        setFailed(true);
        return;
      }
      if (isFailure(result)) {
        setFailed(true);
        return;
      }
      setSubmitted(true);
      // Hold the thank-you, then animate out.
      if (autoCloseMs > 0) dismissTimerRef.current = setTimeout(onClose, autoCloseMs);
    });
  };

  const handleDismiss = () => {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    startTransition(async () => {
      if (!submitted) {
        try {
          await onDismiss?.();
        } catch {
          // A failed snooze must never trap the card on screen.
        }
      }
      onClose();
    });
  };

  return (
    <div className="relative rounded-2xl border border-rule bg-popover px-6 py-5 font-body text-popover-foreground shadow-lg">
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Close"
        className={cn(
          "absolute top-3.5 right-3.5 flex h-7 w-7 items-center justify-center rounded-full text-faint transition-colors",
          "hover:bg-paper hover:text-ink/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          // A 44px hit area on a touch screen; the button itself stays small.
          "pointer-coarse:after:absolute pointer-coarse:after:top-1/2 pointer-coarse:after:left-1/2 pointer-coarse:after:size-11 pointer-coarse:after:-translate-x-1/2 pointer-coarse:after:-translate-y-1/2 pointer-coarse:after:content-['']",
        )}
      >
        <X className="h-4 w-4" />
      </button>

      {submitted ? (
        <div className="flex flex-col items-center gap-2 py-3 pr-2" role="status">
          <span className="text-2xl" role="img" aria-label="Thank you">
            🙏
          </span>
          <p className="text-sm font-bold text-ink">{thankYouTitle}</p>
          <p className="text-center text-xs text-dim">{thankYouMessage}</p>
        </div>
      ) : (
        <>
          <h3 className="mt-1 pr-6 text-base font-extrabold tracking-tight text-ink">{title}</h3>
          <p className="mt-1 text-xs leading-[1.6] text-dim">{description}</p>

          <div className="mt-4 flex justify-center">
            <FaceRating
              value={rating}
              onValueChange={setRating}
              labels={labels}
              size="md"
              label="How was your experience?"
            />
          </div>

          <div className="mt-4">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={placeholder}
              aria-label="Comment"
              maxLength={maxLength}
              rows={2}
              className="w-full resize-none rounded-xl border border-rule bg-paper px-3 py-2 text-sm leading-[1.6] text-ink placeholder:text-faint focus:border-faint focus:ring-0 focus:outline-none"
            />
            {comment.length > 0 && (
              <p className="mt-0.5 text-right text-[10px] text-faint tabular-nums">
                {comment.length}/{maxLength}
              </p>
            )}
          </div>

          {failed && (
            <p className="mt-2 text-xs font-semibold text-stop" role="alert">
              {errorMessage}
            </p>
          )}

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleDismiss}
              disabled={isPending}
              className="rounded-full px-3 py-1.5 text-xs font-medium text-faint transition-colors hover:bg-paper hover:text-dim disabled:opacity-50"
            >
              {dismissLabel}
            </button>
            <OriginFillButton
              onClick={handleSubmit}
              disabled={rating === 0 || isPending}
              loading={isPending}
            >
              {submitLabel}
            </OriginFillButton>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Origin-fill button ─────────────────────────────────────────────────────
// A trimmed copy of 180Connect's OriginButton (default variant, size sm): a
// glassy ink pill whose lime fill grows from the point the pointer came in.

function coverDiameter(width: number, height: number, x: number, y: number) {
  return Math.ceil(
    2 *
      Math.max(
        Math.hypot(x, y),
        Math.hypot(width - x, y),
        Math.hypot(x, height - y),
        Math.hypot(width - x, height - y),
      ),
  );
}

function OriginFillButton({
  children,
  onClick,
  disabled = false,
  loading = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const reduceMotion = useReducedMotionConfig();
  const isDisabled = disabled || loading;
  const [hovered, setHovered] = React.useState(false);
  const [origin, setOrigin] = React.useState({ x: 0, y: 0, size: 0 });
  const showFill = !isDisabled && hovered;

  const fromPoint = (node: HTMLElement, x: number, y: number) => {
    const rect = node.getBoundingClientRect();
    setOrigin({ x, y, size: coverDiameter(rect.width, rect.height, x, y) * 1.25 + 24 });
  };
  const fromPointer = (event: React.PointerEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    fromPoint(event.currentTarget, event.clientX - rect.left, event.clientY - rect.top);
  };

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      onPointerEnter={(event) => {
        if (isDisabled) return;
        fromPointer(event);
        setHovered(true);
      }}
      onPointerDown={(event) => {
        if (isDisabled || event.button !== 0) return;
        fromPointer(event);
        setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
      onFocus={(event) => {
        if (isDisabled || !event.currentTarget.matches(":focus-visible")) return;
        const rect = event.currentTarget.getBoundingClientRect();
        fromPoint(event.currentTarget, rect.width / 2, rect.height / 2);
        setHovered(true);
      }}
      onBlur={() => setHovered(false)}
      whileTap={isDisabled || reduceMotion ? undefined : { scale: 0.98 }}
      className={cn(
        "group relative inline-flex h-8.5 cursor-pointer touch-manipulation items-center justify-center gap-1.5 overflow-hidden rounded-full bg-transparent px-4 text-xs font-semibold tracking-[-0.02em] whitespace-nowrap select-none pointer-coarse:min-h-11",
        "transition-[color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-popover focus-visible:outline-none",
        "disabled:pointer-events-none disabled:opacity-50",
        showFill ? "text-on-lime" : "text-on-solid",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 rounded-full bg-ink/85 shadow-xs ring-1 ring-on-solid/25 backdrop-blur-md transition-opacity duration-300",
          "shadow-[inset_0_1px_0_color-mix(in_oklab,var(--on-solid)_30%,transparent)]",
          showFill ? "opacity-0" : "opacity-100",
        )}
      />
      <motion.span
        aria-hidden
        className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime"
        initial={false}
        animate={{ scale: showFill && origin.size > 0 ? 1 : 0 }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: origin.size, height: origin.size, left: origin.x, top: origin.y }}
      />
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 rounded-full shadow-xs ring-1 ring-rule transition-opacity duration-300",
          showFill ? "opacity-100" : "opacity-0",
        )}
      />
      <span className="relative z-10 inline-flex items-center justify-center gap-2">
        {loading && (
          <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
      </span>
    </motion.button>
  );
}
