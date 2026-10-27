"use client";

import { useEffect, useState } from "react";

import { FeedbackCard, type FeedbackCardProps } from "./feedback-card.tsx";

/** A stateful stand-in for the caller, for the preview and the playground. Not shipped. */

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Long enough for the card's exit to finish before it comes back blank. */
const REOPEN_MS = 900;

/**
 * The card inline, sending after a short pause. Whenever it closes (sent and
 * timed out, "Not now", or the X) it comes back blank, so the stage is never
 * left empty. The box holds the form's height so the page around it does not
 * jump while the card is away or showing its shorter thank-you.
 */
export function FeedbackStage(
  props: Omit<FeedbackCardProps, "open" | "defaultOpen" | "onOpenChange" | "position" | "onSubmit">,
) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (open) return;
    const timer = setTimeout(() => setOpen(true), REOPEN_MS);
    return () => clearTimeout(timer);
  }, [open]);

  return (
    <div className="flex min-h-[392px] w-full max-w-[360px] flex-col justify-center">
      <FeedbackCard {...props} position="inline" open={open} onOpenChange={setOpen} onSubmit={() => wait(900)} />
    </div>
  );
}
