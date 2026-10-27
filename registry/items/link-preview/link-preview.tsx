"use client";

import { useEffect, useRef, useState, type ReactElement, type ReactNode } from "react";
import { Popover } from "radix-ui";
import { ArrowUpRight, X } from "lucide-react";
import { motion, useReducedMotionConfig } from "motion/react";
import { cn } from "@/lib/utils";

export type LinkPreviewProps = {
  children?: ReactNode;
  /** Use an existing link or logo button as the trigger. */
  trigger?: ReactElement;
  /** Keep the preview open and explain when its destination is the current site. */
  isCurrentSite?: boolean;
  href: string;
  title: string;
  /** A screenshot of the destination page. */
  imageSrc: string;
  side?: "top" | "right" | "bottom" | "left";
};

function hostnameOf(href?: string) {
  if (!href?.startsWith("http")) return undefined;
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

/** A page screenshot on hover, focus or tap. No metadata or screenshot service required. */
export function LinkPreview({ children, trigger, isCurrentSite = false, href, title, imageSrc, side = "top" }: LinkPreviewProps) {
  const [open, setOpen] = useState(false);
  const [showNotice, setShowNotice] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduce = useReducedMotionConfig();
  const dismissed = useRef(false);
  const safeHref = /^(https?:\/\/|\/(?!\/))/.test(href) ? href : undefined;
  const address = hostnameOf(safeHref) ?? title;

  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }
  function show() { cancelClose(); dismissed.current = false; setOpen(true); }
  function hide() { dismissed.current = true; setOpen(false); setShowNotice(false); }
  function scheduleClose() {
    cancelClose();
    closeTimer.current = setTimeout(hide, 200);
  }
  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);

  // A portable registry component: consumers supply a page screenshot.
  const screenshot = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={imageSrc} alt={`Screenshot of ${title}`} loading="lazy" className="block h-auto min-h-40 w-full object-contain object-top" />
  );

  return (
    <Popover.Root open={open} onOpenChange={(next) => { cancelClose(); if (next) show(); else hide(); }}>
      <Popover.Trigger
        asChild
        onPointerEnter={(event) => { if (event.pointerType === "mouse") show(); }}
        onPointerLeave={(event) => { if (event.pointerType === "mouse") scheduleClose(); }}
        onFocus={(event) => { if (!dismissed.current && event.currentTarget.matches(":focus-visible")) show(); }}
        onBlur={() => { dismissed.current = false; }}
        onClick={(event) => {
          if (isCurrentSite) {
            event.preventDefault();
            cancelClose();
            setShowNotice(true);
            setOpen(true);
          }
        }}
      >
        {trigger ?? (
          <button type="button" className="inline-flex min-h-11 items-center gap-1 font-body text-[14px] font-medium text-lead underline decoration-rule underline-offset-4 transition-colors hover:decoration-lead focus-visible:rounded-inset focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
            {children}<ArrowUpRight aria-hidden="true" className="size-3.5" />
          </button>
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          asChild side={side} sideOffset={10} collisionPadding={16}
          onOpenAutoFocus={(event) => event.preventDefault()}
          onPointerEnter={cancelClose}
          onPointerLeave={(event) => { if (event.pointerType === "mouse" && !event.currentTarget.contains(document.activeElement)) scheduleClose(); }}
          aria-label={title}
        >
          <motion.div
            initial={{ opacity: 0, scale: reduce ? 1 : 0.96, y: reduce ? 0 : 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={reduce ? { duration: 0 } : { type: "spring", duration: 0.32, bounce: 0.12 }}
            className="group/preview z-50 w-[400px] max-w-[calc(100vw-2rem)] origin-(--radix-popover-content-transform-origin) rounded-panel border border-rule bg-popover p-1 font-body text-popover-foreground shadow-xl"
          >
            {/* The screenshot is the card: the frame's padding makes panel radius minus padding land on the inset radius. */}
            <div className="relative overflow-hidden rounded-inset">
              <div className="max-h-80 overflow-y-auto overscroll-contain" tabIndex={0} role="region" aria-label={`${title} page screenshot`}>
                {isCurrentSite ? (
                  <button type="button" onClick={() => setShowNotice(true)} aria-label={`About ${title}`} className="block w-full cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring">{screenshot}</button>
                ) : safeHref ? (
                  <a href={safeHref} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${title} (opens in a new tab)`} className="block cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring">{screenshot}</a>
                ) : screenshot}
              </div>
              <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-inset ring-1 ring-rule ring-inset" />
              {/* At rest the card is only the page; the address rises in once the pointer or focus is on it. */}
              <span
                aria-hidden={isCurrentSite ? undefined : true}
                className={cn(
                  "pointer-events-none absolute bottom-2 left-2 inline-flex max-w-[calc(100%-1rem)] items-center gap-1 rounded-full bg-popover/85 py-1 pr-2 pl-2.5 text-[11px] font-medium text-ink shadow-sm ring-1 ring-rule backdrop-blur-md transition duration-200 motion-reduce:transition-none",
                  showNotice
                    ? "translate-y-0 opacity-100"
                    : "translate-y-1 opacity-0 group-focus-within/preview:translate-y-0 group-focus-within/preview:opacity-100 group-hover/preview:translate-y-0 group-hover/preview:opacity-100 [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100",
                )}
              >
                {isCurrentSite ? (
                  <span role="status" className="truncate">{showNotice ? "You’re already on the bash-ui website." : address}</span>
                ) : (
                  <><span className="truncate">{address}</span>{safeHref && <ArrowUpRight className="size-3 shrink-0 text-dim" />}</>
                )}
              </span>
              {/* A mouse closes the card by leaving it, so the button only shows for touch and keyboard. */}
              <Popover.Close aria-label="Close preview" className="absolute top-2 right-2 grid size-7 place-items-center rounded-full bg-popover/85 text-ink opacity-0 shadow-sm ring-1 ring-rule backdrop-blur-md transition-opacity before:absolute before:-inset-2 before:content-[''] focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none [@media(hover:none)]:opacity-100"><X className="size-3.5" /></Popover.Close>
            </div>
          </motion.div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
