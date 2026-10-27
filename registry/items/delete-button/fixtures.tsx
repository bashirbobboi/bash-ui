"use client";

import * as React from "react";
import { motion } from "motion/react";

import { DeleteButton, type DeleteButtonProps } from "./delete-button.tsx";

/** How long the empty spot holds after the dust settles, before the button comes back. */
const RETURN_AFTER_MS = 1200;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * The delete button, put back after it snaps so a gallery tile is never left
 * empty. Each return is a fresh mount (a new key), so it comes back idle, and
 * it fades in rather than popping. The first mount does not animate.
 *
 * The fake delete takes 600ms, under the snap's own length, so "Deleting…" is
 * visible even with the snap turned off.
 */
export function RespawningDeleteButton(props: Omit<DeleteButtonProps, "onComplete">) {
  const [round, setRound] = React.useState(0);
  const [gone, setGone] = React.useState(false);

  React.useEffect(() => {
    if (!gone) return;
    const timer = setTimeout(() => {
      setGone(false);
      setRound((n) => n + 1);
    }, RETURN_AFTER_MS);
    return () => clearTimeout(timer);
  }, [gone]);

  return (
    <motion.div
      key={round}
      className="inline-flex"
      initial={round === 0 ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <DeleteButton onConfirm={() => wait(600)} {...props} onComplete={() => setGone(true)} />
    </motion.div>
  );
}
