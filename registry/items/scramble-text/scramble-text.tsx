"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion, useReducedMotionConfig } from "motion/react";

import { cn } from "@/lib/utils";

export interface ScrambleTextProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  /** The word the scramble lands on. */
  text: string;
  /**
   * The frames shown on the way, one every `frameDuration`. Defaults to the
   * original Steeze frames for "Steeze", or a seeded reveal for other text.
   */
  frames?: string[];
  /**
   * A word shown after the scramble, struck through, then swapped for the
   * text. Defaults to "xo" repeated to the text's length ("xoxoxo" for six
   * letters). Pass `null` or "" to land on the text straight away.
   */
  decoy?: string | null;
  /** Milliseconds per scramble frame. */
  frameDuration?: number;
  /** Plays the sequence. False shows the text at rest; turning it back on replays. */
  play?: boolean;
  /** Called once the text has landed. */
  onComplete?: () => void;
}

/** After the decoy appears, how long until it is struck, then how long it stays struck. */
const DECOY_PAUSE = 500;
const STRIKE_HOLD = 1000;
const SWAP = { duration: 0.4 };
const STEEZE_FRAMES = ["Sruxay", "Stqorc", "Stewxd", "Steekj", "Steezo", "Steeze"];
const LETTERS = "abcdefghijklmnopqrstuvwxyz";

function subscribeToHydration() {
  return () => {};
}

/**
 * The text revealed left to right over random letters. Seeded from the text,
 * so the server and the browser draw the same frames.
 */
function revealFrames(text: string): string[] {
  const chars = [...text];
  let seed = 2166136261;
  for (const char of chars) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619) >>> 0;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
  return chars.map((_, frame) =>
    chars
      .map((char, i) => (i <= frame || char.trim() === "" ? char : LETTERS[Math.floor(random() * LETTERS.length)]))
      .join(""),
  );
}

/**
 * Steeze's splash wordmark: the name scrambles into place a letter at a time,
 * a decoy word appears and is struck out, then the name rises in for good.
 *
 * It inherits font, size, tracking and colour from where it sits, so give it a
 * display face. The struck decoy fades to `scramble-strike`. Screen readers hear only
 * the text, and reduced motion shows the text at rest.
 */
export function ScrambleText({
  text,
  frames,
  decoy,
  frameDuration = 100,
  play = true,
  onComplete,
  className,
  ...props
}: ScrambleTextProps) {
  const reduceMotion = useReducedMotionConfig();
  // Motion's default config is "never"; honour the device preference as well.
  const prefersReducedMotion = useReducedMotion();
  const hydrated = React.useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const sequence = React.useMemo(
    () => frames?.length ? frames : text === "Steeze" ? STEEZE_FRAMES : revealFrames(text),
    [frames, text],
  );
  const decoyText = decoy === undefined ? "xo".repeat(Math.ceil(text.length / 2)).slice(0, text.length) : decoy;
  const animate = play && !(hydrated && (reduceMotion || prefersReducedMotion));

  // Steps: one per frame, then the decoy, then the strike, then done.
  const decoyStep = sequence.length;
  const strikeStep = decoyStep + 1;
  const doneStep = decoyText ? strikeStep + 1 : decoyStep;

  // A new run whenever what is being played changes; its step starts at 0
  // without a reset effect, because a stale step belongs to the old run.
  const run = React.useMemo(
    () => ({ sequence, decoyText, frameDuration, animate }),
    [sequence, decoyText, frameDuration, animate],
  );
  const [progress, setProgress] = React.useState({ run, step: 0 });
  const step = !animate ? doneStep : progress.run === run ? progress.step : 0;

  const completeRef = React.useRef(onComplete);
  React.useEffect(() => {
    completeRef.current = onComplete;
  });

  React.useEffect(() => {
    if (!run.animate) return;
    // The source repeats the first frame on its first interval tick.
    const at: number[] = sequence.slice(1).map((_, i) => (i + 2) * frameDuration);
    const decoyAt = (sequence.length + 1) * frameDuration;
    if (decoyText) at.push(decoyAt, decoyAt + DECOY_PAUSE);
    const doneAt = decoyAt + (decoyText ? DECOY_PAUSE + STRIKE_HOLD : 0);
    at.push(doneAt);
    const timers = at.map((ms, i) =>
      window.setTimeout(() => {
        setProgress({ run, step: i + 1 });
      }, ms),
    );
    timers.push(window.setTimeout(() => completeRef.current?.(), doneAt + SWAP.duration * 1000));
    return () => timers.forEach(window.clearTimeout);
  }, [run, sequence, decoyText, frameDuration, decoyStep, doneStep]);

  const phase = step < strikeStep && step < doneStep ? "scramble" : step < doneStep ? "strike" : "done";

  return (
    <span className={cn("relative inline-grid justify-items-center align-baseline leading-[1.5]", className)} {...props}>
      <span className="sr-only">{text}</span>
      {/* Reserve every frame's width so every phase keeps the same centre. */}
      <span aria-hidden="true" className="invisible col-start-1 row-start-1 inline-grid justify-items-center">
        {[...new Set([...sequence, decoyText, text])].map((word) => (
          <span key={word} className="col-start-1 row-start-1 whitespace-pre">{word}</span>
        ))}
      </span>
      <AnimatePresence mode="popLayout">
        {phase !== "done" ? (
          <span key="intro" aria-hidden="true" className="absolute inset-0 flex items-center justify-center tracking-[-0.02em]">
            {phase === "scramble" ? (
              <span className="whitespace-pre">{step < decoyStep ? sequence[step] : decoyText}</span>
            ) : (
              <motion.span
                initial={{ color: "var(--ink)" }}
                animate={{ color: "var(--scramble-strike)" }}
                exit={{ y: "-100%", opacity: 0 }}
                transition={SWAP}
                className="relative inline-block whitespace-pre"
              >
                {decoyText}
                <motion.span
                  className="absolute inset-x-0 top-[60%] h-0.5 origin-center bg-scramble-strike"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.2 }}
                />
              </motion.span>
            )}
          </span>
        ) : (
          <motion.span
            key="done"
            aria-hidden="true"
            // The source moves 10% of its full-height splash, not of a text line.
            initial={animate ? { y: "10vh", opacity: 0 } : false}
            animate={{ y: "0vh", opacity: 1 }}
            transition={SWAP}
            className="absolute inset-0 flex items-center justify-center whitespace-pre tracking-[-0.05em]"
          >
            {text}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

export default ScrambleText;
