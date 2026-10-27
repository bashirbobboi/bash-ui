"use client";

import * as React from "react";
import { Dialog } from "radix-ui";
import { AnimatePresence, motion, useDragControls, useReducedMotionConfig, type PanInfo } from "motion/react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

export interface FeedbackSheetProps {
  /** Whether the sheet is up. Ignored when `inline`. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Receives the trimmed text. While its promise is pending the button reads `pendingLabel`; on success the field clears and the sheet closes. */
  onSubmit?: (text: string) => void | Promise<void>;
  /** A visible heading. Without one the sheet is just the field, as in the app, and "Give feedback" names it for screen readers. */
  title?: string;
  /** A line under the heading. */
  description?: string;
  placeholder?: string;
  submitLabel?: string;
  pendingLabel?: string;
  maxLength?: number;
  /** A quiet underlined link under the button, e.g. to a public ideas board. Shown when set. */
  linkLabel?: string;
  onLinkClick?: () => void;
  /** Renders the panel in place, without the portal, backdrop or slide: for previews and docs. */
  inline?: boolean;
  defaultValue?: string;
  className?: string;
}

/** How far down (fraction of the sheet's height) or how fast (px/s) a drag must go to dismiss. */
const DISMISS_FRACTION = 0.25;
const DISMISS_VELOCITY = 500;
const SLIDE = { type: "spring", damping: 40, stiffness: 420, mass: 1 } as const;

/**
 * Steeze's quick-feedback sheet: a tall, dark bottom sheet that is almost all
 * text field, a cream pill to send, and an optional link underneath. It slides
 * up over a dimmed page; drag the handle down, press Escape or tap outside to
 * put it away. Reduced motion fades it instead of sliding.
 */
export function FeedbackSheet({
  open = false,
  onOpenChange,
  onSubmit,
  title,
  description,
  placeholder = "Share your thoughts…",
  submitLabel = "Submit Feedback",
  pendingLabel = "Submitting...",
  maxLength = 1000,
  linkLabel,
  onLinkClick,
  inline = false,
  defaultValue = "",
  className,
}: FeedbackSheetProps) {
  const reduceMotion = useReducedMotionConfig();
  const dragControls = useDragControls();
  const sheetRef = React.useRef<HTMLDivElement>(null);
  const fieldRef = React.useRef<HTMLTextAreaElement>(null);
  const [text, setText] = React.useState(defaultValue);
  const [pending, setPending] = React.useState(false);
  const empty = text.trim().length === 0;

  async function submit() {
    const trimmed = text.trim();
    if (!trimmed || pending) return;
    setPending(true);
    try {
      await onSubmit?.(trimmed);
      setText("");
      if (!inline) onOpenChange?.(false);
    } catch {
      // Keep what they wrote so they can try again; the caller reports the error.
    } finally {
      setPending(false);
    }
  }

  function onDragEnd(_: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) {
    const height = sheetRef.current?.offsetHeight ?? 1;
    if (info.offset.y > height * DISMISS_FRACTION || info.velocity.y > DISMISS_VELOCITY) onOpenChange?.(false);
  }

  const TitleTag = inline ? "h2" : Dialog.Title;
  const DescriptionTag = inline ? "p" : Dialog.Description;

  const panel = (
    <>
      {/* The grab handle: drag it down to dismiss. */}
      <div
        aria-hidden="true"
        onPointerDown={inline ? undefined : (event) => dragControls.start(event)}
        className={cn("flex shrink-0 justify-center p-2.5", !inline && "cursor-grab touch-none active:cursor-grabbing")}
      >
        <span className="h-1 w-[30px] rounded-full bg-ink" />
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col px-6 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          aria-label="Close"
          onClick={() => onOpenChange?.(false)}
          className="absolute top-4 right-4 z-10 rounded-full bg-ground/70 p-2.5 text-ink shadow-md transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <X className="size-[22px]" aria-hidden="true" />
        </button>

        {title ? (
          <TitleTag className="mb-1 pr-14 font-body text-xl font-medium text-popover-foreground">{title}</TitleTag>
        ) : (
          <TitleTag className="sr-only">Give feedback</TitleTag>
        )}
        {description ? (
          <DescriptionTag className="mb-3 pr-14 font-body text-sm text-dim">{description}</DescriptionTag>
        ) : null}

        <textarea
          ref={fieldRef}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              void submit();
            }
          }}
          placeholder={placeholder}
          maxLength={maxLength}
          aria-label={title ? undefined : "Your feedback"}
          className="max-h-[220px] min-h-[120px] w-full resize-none rounded-xl bg-transparent py-3 pr-14 pl-4 font-body text-2xl font-medium text-popover-foreground caret-ink outline-none placeholder:text-dim"
        />

        <div className="mt-auto pt-4">
          <button
            type="button"
            onClick={() => void submit()}
            disabled={pending || empty}
            aria-busy={pending || undefined}
            className="flex w-full items-center justify-center rounded-[24px] bg-primary py-3 font-body text-base font-semibold text-primary-foreground transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:bg-primary/10 disabled:text-primary/40"
          >
            {pending ? pendingLabel : submitLabel}
          </button>
          {linkLabel ? (
            <div className="flex justify-center pt-3">
              <button
                type="button"
                onClick={onLinkClick}
                className="font-body text-base text-popover-foreground underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {linkLabel}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );

  if (inline) {
    return (
      <div
        role="group"
        aria-label={title ?? "Give feedback"}
        className={cn("flex h-[460px] w-full max-w-[400px] flex-col overflow-hidden rounded-[24px] bg-popover font-body", className)}
      >
        {panel}
      </div>
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-ground/60"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              />
            </Dialog.Overlay>
            <Dialog.Content
              asChild
              forceMount
              // No description: tell Radix the field speaks for itself.
              {...(description ? {} : { "aria-describedby": undefined })}
              onOpenAutoFocus={(event) => {
                event.preventDefault();
                fieldRef.current?.focus();
              }}
            >
              <motion.div
                ref={sheetRef}
                drag={reduceMotion ? false : "y"}
                dragControls={dragControls}
                dragListener={false}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 1 }}
                onDragEnd={onDragEnd}
                initial={reduceMotion ? { opacity: 0 } : { y: "100%" }}
                animate={reduceMotion ? { opacity: 1 } : { y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { y: "100%" }}
                transition={reduceMotion ? { duration: 0.2 } : SLIDE}
                className={cn(
                  "fixed inset-x-0 bottom-0 z-50 mx-auto flex h-[70dvh] w-full max-w-[520px] flex-col rounded-t-[24px] bg-popover font-body shadow-lg outline-none",
                  className,
                )}
              >
                {panel}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}

export default FeedbackSheet;
