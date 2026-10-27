"use client";

/**
 * Highly inspired by Mikhail Bespalov's codepen
 * https://codepen.io/Mikhail-Bespalov/pen/yLmpxOG
 */

import * as React from "react";
import {
  motion,
  useAnimate,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotionConfig,
} from "motion/react";

import { cn } from "@/lib/utils";

const MAX_DISPLACEMENT = 300;
/** Ease-out cubic: the dust leaves fast and settles. */
const easeOutCubic = (time: number) => 1 - Math.pow(1 - time, 3);

type SnapTiming = {
  /** Seconds the dissolve takes. */
  duration: number;
  /** Fraction of the duration the target stays opaque before fading. */
  opacityStart: number;
};

/**
 * The dissolve itself, shared by the wrapper and the delete button: an SVG
 * filter whose displacement map is driven from 0 to 300 while the target
 * scales up and fades. Big low-frequency noise tears the element into
 * clumps; fine noise grinds the clumps into dust.
 *
 * Returns the refs to attach, a `filter` element to render once beside the
 * target, and `snap` / `reset`. Under reduced motion the snap is a short
 * fade with no displacement or growth.
 */
export function useThanosSnap({ duration, opacityStart }: SnapTiming) {
  const reduceMotion = useReducedMotionConfig();
  const reactId = React.useId();
  const filterId = `dissolve-filter-${reactId.replace(/[^a-zA-Z0-9-_]/g, "")}`;

  const [scope, animate] = useAnimate<HTMLDivElement>();
  const targetRef = React.useRef<HTMLDivElement>(null);
  const displacementMapRef = React.useRef<SVGFEDisplacementMapElement>(null);
  const displacement = useMotionValue(0);

  useMotionValueEvent(displacement, "change", (latest) => {
    displacementMapRef.current?.setAttribute("scale", latest.toString());
  });

  const snap = React.useCallback(async () => {
    const target = targetRef.current;
    if (!target) return;

    if (reduceMotion) {
      await animate(target, { opacity: 0 }, { duration: 0.2 });
      return;
    }

    const transition = { duration, ease: easeOutCubic };
    await Promise.all([
      animate(
        target,
        { scale: 1.2, opacity: [1, 1, 0] },
        { ...transition, times: [0, opacityStart, 1] },
      ),
      animate(displacement, MAX_DISPLACEMENT, transition),
    ]);
  }, [animate, displacement, duration, opacityStart, reduceMotion]);

  const reset = React.useCallback(() => {
    if (targetRef.current) {
      animate(targetRef.current, { scale: 1, opacity: 1 }, { duration: 0 });
    }
    displacement.set(0);
  }, [animate, displacement]);

  const filter = (
    <svg
      aria-hidden="true"
      width="0"
      height="0"
      className="pointer-events-none absolute -z-10 opacity-0"
    >
      <defs>
        <filter
          id={filterId}
          x="-300%"
          y="-300%"
          width="600%"
          height="600%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.015"
            numOctaves="1"
            result="bigNoise"
          />
          <feComponentTransfer in="bigNoise" result="bigNoiseAdjusted">
            <feFuncR type="linear" slope="0.5" intercept="-0.2" />
            <feFuncG type="linear" slope="3" intercept="-0.6" />
          </feComponentTransfer>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="1"
            numOctaves="2"
            result="fineNoise"
          />
          <feMerge result="combinedNoise">
            <feMergeNode in="bigNoiseAdjusted" />
            <feMergeNode in="fineNoise" />
          </feMerge>
          <feDisplacementMap
            ref={displacementMapRef}
            in="SourceGraphic"
            in2="combinedNoise"
            scale="0"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );

  return {
    scope,
    targetRef,
    filterStyle: { filter: `url(#${filterId})` } as const,
    filter,
    snap,
    reset,
  };
}

export interface ThanosSnapEffectProps extends React.PropsWithChildren {
  /** Classes for the wrapper. It is `relative inline-block`; pass `block` to fill a row. */
  className?: string;
  /**
   * Fires once the dissolve has finished. Remove the wrapped thing here, not
   * before: unmounting it mid-snap cuts the dust off.
   */
  onComplete?: () => void;
  /** Clicking the wrapped content snaps it. Defaults to true; turn off when a button inside drives it. */
  triggerOnClick?: boolean;
  /** Snaps when this turns true. */
  trigger?: boolean;
  /**
   * Milliseconds after the snap before the content quietly reappears, ready to
   * snap again. Defaults to 500. Pass `null` to leave it dissolved, which is
   * what a delete wants while its row folds away.
   */
  resetDelay?: number | null;
}

export interface ThanosSnapEffectRef {
  /** Dissolves the content; resolves when the dust has settled. */
  snap: () => Promise<void>;
  /** Puts the content back at once. */
  reset: () => void;
}

/**
 * Wraps anything and dissolves it to dust on demand: through the ref's
 * `snap()`, a `trigger` prop, or a click.
 */
export const ThanosSnapEffect = React.forwardRef<
  ThanosSnapEffectRef,
  ThanosSnapEffectProps
>(function ThanosSnapEffect(
  { children, className, onComplete, triggerOnClick = true, trigger, resetDelay = 500 },
  ref,
) {
  const { scope, targetRef, filterStyle, filter, snap: dissolve, reset } =
    useThanosSnap({ duration: 0.6, opacityStart: 0.5 });
  const animating = React.useRef(false);
  const resetTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    [],
  );

  const snap = React.useCallback(async () => {
    if (animating.current) return;
    animating.current = true;

    await dissolve();
    onComplete?.();

    if (resetDelay === null) return;
    resetTimer.current = setTimeout(() => {
      reset();
      animating.current = false;
    }, resetDelay);
  }, [dissolve, onComplete, reset, resetDelay]);

  const resetNow = React.useCallback(() => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    reset();
    animating.current = false;
  }, [reset]);

  React.useImperativeHandle(ref, () => ({ snap, reset: resetNow }), [snap, resetNow]);

  React.useEffect(() => {
    if (trigger) void snap();
  }, [trigger, snap]);

  return (
    <div ref={scope} className={cn("relative inline-block", className)}>
      <motion.div
        ref={targetRef}
        onClick={triggerOnClick ? () => void snap() : undefined}
        style={filterStyle}
        className="will-change-transform"
      >
        {children}
      </motion.div>
      {filter}
    </div>
  );
});

ThanosSnapEffect.displayName = "ThanosSnapEffect";
