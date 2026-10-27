"use client";

import * as React from "react";
import { Tooltip as TooltipPrimitive } from "radix-ui";
import { AnimatePresence, motion, useReducedMotionConfig } from "motion/react";
import { Info } from "lucide-react";

import { cn } from "@/lib/utils";

export interface InfoTooltipProps {
  /** The body of the tooltip. */
  content?: React.ReactNode;
  /** Optional bold title at the top. */
  title?: React.ReactNode;
  /** Optional footer, under a hairline (a source, a caveat). */
  footer?: React.ReactNode;
  /** Custom trigger. When omitted, an accessible (i) icon button is rendered. */
  children?: React.ReactNode;
  /** Side of the trigger to open on. Defaults to "top". */
  side?: "top" | "bottom" | "left" | "right";
  /** Alignment against the trigger. Defaults to "center". */
  align?: "start" | "center" | "end";
  /** Gap from the trigger in pixels. Defaults to 6. */
  sideOffset?: number;
  /** Extra classes for the tooltip box. */
  contentClassName?: string;
  /** Extra classes for the default (i) trigger. */
  triggerClassName?: string;
  /** Hover delay before opening, in ms. Defaults to 150. */
  delayDuration?: number;
  /** Accessible label for the default trigger. Falls back to the title or content when they are strings. */
  label?: string;
  /** Show a small arrow pointing at the trigger. Defaults to false. */
  showArrow?: boolean;
}

/**
 * A small explanation behind an (i). An inverted box (`bg-ink` on
 * `text-on-solid`, so it flips with the mode) that springs out of its
 * trigger, with an optional title and footer.
 *
 * On a phone, Radix never opens a tooltip on touch, which would leave the
 * explanation unreachable. The default (i) trigger explains and does nothing
 * else, so a tap opens it; a custom trigger might be a link or a control,
 * where a tap has to keep doing that instead.
 */
export function InfoTooltip({
  content,
  title,
  footer,
  children,
  side = "top",
  align,
  sideOffset = 6,
  contentClassName,
  triggerClassName,
  delayDuration = 150,
  label,
  showArrow = false,
}: InfoTooltipProps) {
  const reduceMotion = useReducedMotionConfig();
  const [open, setOpen] = React.useState(false);
  // The box is portalled to <body>, out of any `[data-theme]` scope the
  // trigger sits in. Carry the scope across so the tooltip wears the same
  // design system as the thing it explains.
  const [theme, setTheme] = React.useState<string | undefined>();
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const touchRef = React.useRef(false);
  const openOnTap = !children;

  function changeOpen(next: boolean) {
    if (next) {
      setTheme(
        triggerRef.current?.closest("[data-theme]")?.getAttribute("data-theme") ??
          undefined,
      );
    }
    setOpen(next);
  }

  function handlePointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    touchRef.current = openOnTap && event.pointerType === "touch";
    // Radix closes an open tooltip on pointer-down; for a tap that would undo
    // the open the click below is about to make.
    if (touchRef.current) event.preventDefault();
  }

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    if (!touchRef.current) return;
    touchRef.current = false;
    // Radix's own click handler closes the tooltip; a prevented event skips it.
    event.preventDefault();
    changeOpen(true);
  }

  if (!content && !title) {
    return <>{children}</>;
  }

  const trigger = children ?? (
    <button
      type="button"
      aria-label={
        label ??
        (typeof title === "string"
          ? title
          : typeof content === "string"
            ? content
            : "More information")
      }
      className={cn(
        "inline-flex cursor-help items-center justify-center rounded-full text-faint transition-colors hover:text-dim",
        "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-lead",
        // A 44px hit area on a touch screen; the icon itself stays small.
        "pointer-coarse:relative pointer-coarse:after:absolute pointer-coarse:after:top-1/2 pointer-coarse:after:left-1/2 pointer-coarse:after:size-[max(100%,44px)] pointer-coarse:after:-translate-x-1/2 pointer-coarse:after:-translate-y-1/2 pointer-coarse:after:content-['']",
        triggerClassName,
      )}
    >
      <Info className="size-3.5" />
    </button>
  );

  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root open={open} onOpenChange={changeOpen}>
        <TooltipPrimitive.Trigger
          ref={triggerRef}
          asChild
          onPointerDown={handlePointerDown}
          onClick={handleClick}
        >
          {trigger}
        </TooltipPrimitive.Trigger>

        <AnimatePresence>
          {open && (
            <TooltipPrimitive.Portal forceMount>
              <TooltipPrimitive.Content
                asChild
                forceMount
                side={side}
                align={align}
                sideOffset={sideOffset}
                // Never flush against a phone's edge.
                collisionPadding={12}
              >
                <motion.div
                  data-slot="info-tooltip"
                  data-theme={theme}
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.5 }}
                  transition={
                    reduceMotion
                      ? { duration: 0.1 }
                      : { type: "spring", stiffness: 300, damping: 25 }
                  }
                  className={cn(
                    "z-50 w-max max-w-[18rem] origin-(--radix-tooltip-content-transform-origin) max-sm:max-w-[calc(100vw-1.5rem)]",
                    "rounded-inset border border-on-solid/10 bg-ink px-3.5 py-2.5 text-left font-body text-[12px] leading-[1.5] text-balance text-on-solid shadow-lg",
                    contentClassName,
                  )}
                >
                  {title && (
                    <span className="block font-semibold text-on-solid">{title}</span>
                  )}
                  {content && (
                    <span className={cn("block text-on-solid/80", title && "mt-1")}>
                      {content}
                    </span>
                  )}
                  {footer && (
                    <span className="mt-2 block border-t border-on-solid/10 pt-1.5 text-[11px] text-on-solid/70">
                      {footer}
                    </span>
                  )}
                  {showArrow && (
                    <TooltipPrimitive.Arrow className="z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px] bg-ink fill-ink" />
                  )}
                </motion.div>
              </TooltipPrimitive.Content>
            </TooltipPrimitive.Portal>
          )}
        </AnimatePresence>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
