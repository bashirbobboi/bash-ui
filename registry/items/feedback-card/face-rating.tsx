"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotionConfig } from "motion/react";

import { cn } from "@/lib/utils";

/**
 * A 1–5 rating whose face morphs with the mood: the mouth bends from a deep
 * frown to a wide smile, the eyes squint or widen, and brows appear when it is
 * upset. Hovering a segment previews that face; a commit makes it bounce.
 *
 * The colours run along the theme's ramp (stop → ramp-orange →
 * milestone-yellow → go-pale → go), so the face is a mark, never text. They
 * change through a CSS colour transition on `currentColor` rather than a motion
 * tween, so any colour space a theme writes its tokens in still animates.
 */

export const RATING_LEVELS = [1, 2, 3, 4, 5] as const;

/** One ramp token per level, bad to good. */
export const RATING_COLORS = [
  "var(--stop)",
  "var(--ramp-orange)",
  "var(--milestone-yellow)",
  "var(--go-pale)",
  "var(--go)",
] as const;

/** The face while nothing is rated. */
export const RATING_UNSET_COLOR = "var(--faint)";

/** Mouth control-point Y per level: deep frown → flat → big smile. */
const MOUTH_CONTROL_Y = [34, 41, 47, 54, 61] as const;
/** Mouth corner Y per level: corners droop when upset, lift when delighted. */
const MOUTH_CORNER_Y = [49.5, 48, 47, 46, 44.5] as const;
/** Eye squash per level: narrowed when upset, wide open when amazed. */
const EYE_SCALE_Y = [0.45, 0.6, 0.9, 1, 1.25] as const;

function mouthPath(level: number): string {
  const clamped = Math.max(1, Math.min(5, Math.round(level || 3)));
  const corner = MOUTH_CORNER_Y[clamped - 1];
  const control = MOUTH_CONTROL_Y[clamped - 1];
  return `M 22 ${corner} Q 36 ${control} 50 ${corner}`;
}

export type RatingLabels = [string, string, string, string, string];

export interface FaceRatingProps {
  /** Controlled rating from 1–5; 0 means unset. Leave undefined for uncontrolled use. */
  value?: number;
  /** Initial rating when uncontrolled. Default 0 (unset). */
  defaultValue?: number;
  /** Fires with the next rating on every commit. */
  onValueChange?: (value: number) => void;
  /** Mood names for levels 1–5, shown under the widget and read to screen readers. */
  labels?: RatingLabels;
  /** Show the mood label under the segments. Default true. */
  showLabel?: boolean;
  /** Visual size of the widget. Default "md". */
  size?: "sm" | "md" | "lg";
  /** Accessible name of the radio group. */
  label?: string;
  className?: string;
}

const DEFAULT_LABELS: RatingLabels = ["Terrible", "Bad", "Okay", "Good", "Amazing"];

/** Softer, organic spring shared by the mouth morph and the eyes. */
const MORPH_SPRING = { type: "spring", stiffness: 260, damping: 22 } as const;
/** Snappy spring for segment press feedback and the checked-ring pop. */
const SPRING_SNAPPY = { type: "spring", stiffness: 500, damping: 30 } as const;
/** Eyes and eyebrows begin this long after the mouth, in seconds. */
const FEATURE_STAGGER = 0.03;
/** Ease for the mood label crossfade. */
const LABEL_TRANSITION = { duration: 0.18, ease: [0.22, 1, 0.36, 1] } as const;
/** Colour change, close to the morph spring's settle time. */
const COLOR_TRANSITION = "color 400ms cubic-bezier(0.22, 1, 0.36, 1)";

const SIZES = {
  sm: {
    face: 56,
    root: "gap-2",
    row: "gap-1.5",
    segment: "h-6 w-6 text-[10px]",
    labelBox: "h-4",
    labelText: "text-xs",
  },
  md: {
    face: 72,
    root: "gap-3",
    row: "gap-2",
    segment: "h-7 w-7 text-xs",
    labelBox: "h-5",
    labelText: "text-sm",
  },
  lg: {
    face: 96,
    root: "gap-4",
    row: "gap-2.5",
    segment: "h-9 w-9 text-sm",
    labelBox: "h-6",
    labelText: "text-base",
  },
} as const;

export function FaceRating({
  value: valueProp,
  defaultValue = 0,
  onValueChange,
  labels = DEFAULT_LABELS,
  showLabel = true,
  size = "md",
  label = "How was your experience?",
  className,
}: FaceRatingProps) {
  const reduceMotion = useReducedMotionConfig();
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const [hovered, setHovered] = React.useState(0);
  const [bouncing, setBouncing] = React.useState(false);
  const segmentRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

  const value = valueProp ?? internalValue;
  // The face previews the hovered level and falls back to the committed value.
  const active = hovered || value;
  const level = active || 3;
  const faceColor = active ? RATING_COLORS[active - 1] : RATING_UNSET_COLOR;
  const sizes = SIZES[size];

  const spring = reduceMotion ? { duration: 0 } : MORPH_SPRING;
  // Eyes and eyebrows trail the mouth slightly so the face reads organically.
  const featureTransition = reduceMotion
    ? { duration: 0 }
    : { ...MORPH_SPRING, delay: FEATURE_STAGGER };

  const commit = (next: number) => {
    if (valueProp === undefined) setInternalValue(next);
    onValueChange?.(next);
    if (!reduceMotion) setBouncing(true);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    let next: number;
    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      next = Math.min(5, value + 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      next = value === 0 ? 1 : Math.max(1, value - 1);
    } else {
      return;
    }
    event.preventDefault();
    segmentRefs.current[next - 1]?.focus();
    if (next !== value) commit(next);
  };

  return (
    <div className={cn("flex flex-col items-center", sizes.root, className)}>
      {/* Morphing face: decorative; the radio group below carries the state. */}
      <motion.div
        aria-hidden="true"
        initial={false}
        animate={bouncing ? { y: [0, -6, 0], scale: [1, 1.08, 1] } : { y: 0, scale: 1 }}
        transition={
          bouncing ? { duration: 0.45, times: [0, 0.4, 1], ease: "easeOut" } : { duration: 0 }
        }
        onAnimationComplete={() => setBouncing(false)}
      >
        <svg
          viewBox="0 0 72 72"
          width={sizes.face}
          height={sizes.face}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          style={{ color: faceColor, transition: reduceMotion ? undefined : COLOR_TRANSITION }}
        >
          <circle cx={36} cy={36} r={30} strokeWidth={4} />
          {/* Eyebrows: only surface while upset (levels 1–2). */}
          <motion.line
            x1={19}
            y1={19}
            x2={30}
            y2={23}
            strokeWidth={3}
            initial={false}
            animate={{ opacity: level <= 2 ? 1 : 0 }}
            transition={featureTransition}
          />
          <motion.line
            x1={42}
            y1={23}
            x2={53}
            y2={19}
            strokeWidth={3}
            initial={false}
            animate={{ opacity: level <= 2 ? 1 : 0 }}
            transition={featureTransition}
          />
          <motion.ellipse
            cx={25}
            cy={30}
            rx={3.5}
            ry={4}
            fill="currentColor"
            stroke="none"
            style={{ originX: 0.5, originY: 0.5 }}
            initial={false}
            animate={{ scaleY: EYE_SCALE_Y[level - 1] }}
            transition={featureTransition}
          />
          <motion.ellipse
            cx={47}
            cy={30}
            rx={3.5}
            ry={4}
            fill="currentColor"
            stroke="none"
            style={{ originX: 0.5, originY: 0.5 }}
            initial={false}
            animate={{ scaleY: EYE_SCALE_Y[level - 1] }}
            transition={featureTransition}
          />
          {/* Mouth: the core morph between frown, flat and smile. */}
          <motion.path
            strokeWidth={4}
            initial={false}
            animate={{ d: mouthPath(level) }}
            transition={spring}
          />
        </svg>
      </motion.div>

      <div
        role="radiogroup"
        aria-label={label}
        className={cn(
          "flex items-center rounded-full border border-rule-soft bg-paper p-1 shadow-inner backdrop-blur-md",
          sizes.row,
        )}
        onMouseLeave={() => setHovered(0)}
      >
        {RATING_LEVELS.map((segmentLevel) => {
          const isActive = value === segmentLevel;
          const color = RATING_COLORS[segmentLevel - 1];
          return (
            <motion.button
              key={segmentLevel}
              ref={(node) => {
                segmentRefs.current[segmentLevel - 1] = node;
              }}
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-label={`Rate ${segmentLevel} of 5: ${labels[segmentLevel - 1]}`}
              tabIndex={isActive || (value === 0 && segmentLevel === 1) ? 0 : -1}
              onClick={() => commit(segmentLevel)}
              onKeyDown={handleKeyDown}
              onMouseEnter={() => setHovered(segmentLevel)}
              whileTap={reduceMotion ? undefined : { scale: 0.9 }}
              transition={reduceMotion ? { duration: 0 } : SPRING_SNAPPY}
              className={cn(
                "relative inline-flex touch-manipulation select-none items-center justify-center rounded-full font-body font-bold tabular-nums transition-all duration-200",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-rule",
                sizes.segment,
                isActive ? "bg-card shadow-xs" : "text-dim hover:bg-paper-sunk hover:text-ink",
              )}
              style={isActive ? { color } : undefined}
            >
              <AnimatePresence initial={false}>
                {isActive && (
                  <motion.span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-full"
                    style={{
                      backgroundColor: `color-mix(in oklab, ${color} 9%, transparent)`,
                      boxShadow: `inset 0 0 0 1.5px ${color}`,
                    }}
                    initial={reduceMotion ? false : { scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={
                      reduceMotion
                        ? { opacity: 0, transition: { duration: 0 } }
                        : { scale: 0.5, opacity: 0 }
                    }
                    transition={reduceMotion ? { duration: 0 } : SPRING_SNAPPY}
                  />
                )}
              </AnimatePresence>
              <span className="relative z-10">{segmentLevel}</span>
            </motion.button>
          );
        })}
      </div>

      {showLabel && (
        <div
          className={cn("relative flex items-center justify-center overflow-hidden", sizes.labelBox)}
        >
          {/* popLayout crossfades the labels so hover → leave never flashes
              an empty frame while settling back to the committed value. */}
          <AnimatePresence mode="popLayout" initial={false}>
            {active > 0 && (
              <motion.span
                key={active}
                className={cn("font-body font-medium text-dim", sizes.labelText)}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={reduceMotion ? { duration: 0 } : LABEL_TRANSITION}
              >
                {labels[active - 1]}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
