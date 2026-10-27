"use client";

import * as React from "react";
import { flushSync } from "react-dom";
import {
  animate,
  motion,
  useDragControls,
  useMotionValue,
  useReducedMotionConfig,
  useTransform,
  type MotionValue,
  type PanInfo,
} from "motion/react";
import { Check, Heart, X } from "lucide-react";

import { cn } from "@/lib/utils";

export type SwipeCardsItem = {
  id: string;
  title: string;
  /** Cover image URL. */
  image: string;
  /** Shown under the title in the `choice` variant. */
  description?: string;
  /** Preformatted, e.g. "₦85,000". */
  price?: string;
  brand?: string;
  condition?: string;
  size?: string;
};

export type SwipeDirection = "left" | "right";

export interface SwipeCardsProps {
  items: SwipeCardsItem[];
  /**
   * `feed`: round skip and heart buttons, a price chip and condition, as on the
   * Steeze tab. `choice`: two labelled pills (No / Yes, Less / More) that fill
   * as the card leans, for quick surveys and tuning.
   */
  variant?: "feed" | "choice";
  /** Left action and the stamp shown when dragging left. Defaults to "Skip" (feed) or "No" (choice). */
  leftLabel?: string;
  /** Right action. Defaults to "Like" (feed, stamped as ♥) or "Yes" (choice). */
  rightLabel?: string;
  /** Start again from the first card after the last. Defaults to true. */
  loop?: boolean;
  /** A card left the deck. `index` is its position in `items`. */
  onSwipe?: (item: SwipeCardsItem, direction: SwipeDirection, index: number) => void;
  /** The top card changed; `index` is its position in `items`. */
  onIndexChange?: (index: number) => void;
  /** Every card is gone (only when `loop` is false). */
  onEmpty?: () => void;
  /** The top card was tapped or Enter was pressed on the deck. */
  onCardPress?: (item: SwipeCardsItem) => void;
  /** Shows an "Add to Bag" chip on each card. */
  onAddToBag?: (item: SwipeCardsItem) => void;
  addToBagLabel?: string;
  /** The drag crossed the commit point; the app plays a light haptic here. */
  onThresholdCross?: (direction: SwipeDirection) => void;
  /** Rendered in place of the deck once it is empty. */
  empty?: React.ReactNode;
  /** Accessible name for the deck. */
  label?: string;
  className?: string;
}

/** Commit when the drag passes a quarter of the deck's width… */
const THRESHOLD = 0.25;
/** …or is released faster than this, in px/s. */
const FLING = 800;
/** Each card behind sits 12px lower and 3% smaller. */
const STACK_SEP = 12;
const STACK_SCALE = 0.03;
/** Degrees of tilt per deck-width of drag. */
const TILT = 15;
/** Reanimated's withTiming default (ease in-out quad), 280ms, to 1.5 widths away. */
const FLY = { duration: 0.28, ease: [0.455, 0.03, 0.515, 0.955] } as const;
const SNAP = { type: "spring", stiffness: 300, damping: 20 } as const;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

type CardMotion = {
  x: MotionValue<number>;
  y: MotionValue<number>;
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  opacity: MotionValue<number>;
};

type TopEffects = {
  leftStamp: MotionValue<number>;
  rightStamp: MotionValue<number>;
  leftFill: MotionValue<number>;
  rightFill: MotionValue<number>;
  leftPill: MotionValue<number>;
  rightPill: MotionValue<number>;
};

/**
 * Steeze's swipe deck: drag the top card right to like it or left to skip it,
 * or use the buttons or the arrow keys. The card tilts as it travels, a stamp
 * and the matching button fill in as it nears the commit point, and the cards
 * behind rise to take its place. Data in, a callback per swipe out.
 */
export function SwipeCards({
  items,
  variant = "feed",
  leftLabel,
  rightLabel,
  loop = true,
  onSwipe,
  onIndexChange,
  onEmpty,
  onCardPress,
  onAddToBag,
  addToBagLabel = "Add to Bag",
  onThresholdCross,
  empty = null,
  label = "Swipe deck",
  className,
}: SwipeCardsProps) {
  const reduceMotion = useReducedMotionConfig();
  const left = leftLabel ?? (variant === "choice" ? "No" : "Skip");
  const right = rightLabel ?? (variant === "choice" ? "Yes" : "Like");

  const rootRef = React.useRef<HTMLDivElement>(null);
  const controls = useDragControls();
  const [swiped, setSwiped] = React.useState(0);
  const busy = React.useRef(false);
  const crossed = React.useRef<{ left: boolean; right: boolean }>({ left: false, right: false });
  const dragged = React.useRef(false);

  // Pan of the top card, and the deck's width (the source measures the screen).
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const width = useMotionValue(360);
  const topOpacity = useMotionValue(1);
  const zero = useMotionValue(0);
  const one = useMotionValue(1);

  React.useEffect(() => {
    const element = rootRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => width.set(entry.contentRect.width || 360));
    observer.observe(element);
    return () => observer.disconnect();
  }, [width]);

  const threshold = () => width.get() * THRESHOLD;
  const progress = useTransform(() => clamp01(Math.abs(x.get()) / threshold()));
  const tilt = useTransform(() => (x.get() / width.get()) * TILT);

  // The cards behind close the gap as the top card leaves.
  const secondScale = useTransform(progress, [0, 1], [1 - STACK_SCALE, 1]);
  const secondY = useTransform(progress, [0, 1], [STACK_SEP, 0]);
  const thirdScale = useTransform(progress, [0, 1], [1 - STACK_SCALE * 2, 1 - STACK_SCALE]);
  const thirdY = useTransform(progress, [0, 1], [STACK_SEP * 2, STACK_SEP]);

  const effects: TopEffects = {
    leftStamp: useTransform(() => clamp01((-x.get() - threshold() * 0.4) / (threshold() * 0.6))),
    rightStamp: useTransform(() => clamp01((x.get() - threshold() * 0.4) / (threshold() * 0.6))),
    leftFill: useTransform(() => clamp01(-x.get() / threshold())),
    rightFill: useTransform(() => clamp01(x.get() / threshold())),
    // The pills read full at half the threshold, before the card commits.
    leftPill: useTransform(() => clamp01(-x.get() / (threshold() * 0.5))),
    rightPill: useTransform(() => clamp01(x.get() / (threshold() * 0.5))),
  };

  const motionFor: CardMotion[] = [
    { x, y, rotate: reduceMotion ? zero : tilt, scale: one, opacity: topOpacity },
    { x: zero, y: secondY, rotate: zero, scale: secondScale, opacity: one },
    { x: zero, y: thirdY, rotate: zero, scale: thirdScale, opacity: one },
  ];

  const length = items.length;
  const finished = !loop && swiped >= length;
  const positionOf = (absolute: number) => (loop ? absolute % length : absolute);
  const cardAt = (absolute: number) =>
    length === 0 || (!loop && absolute >= length) ? null : items[positionOf(absolute)];
  const current = cardAt(swiped);

  const emptyRef = React.useRef(onEmpty);
  React.useEffect(() => {
    emptyRef.current = onEmpty;
  });
  React.useEffect(() => {
    if (finished && length > 0) emptyRef.current?.();
  }, [finished, length]);

  function commit(direction: SwipeDirection) {
    if (busy.current || !current) return;
    busy.current = true;
    const item = current;
    const index = positionOf(swiped);
    const land = () => {
      // Recentre the pan first, then swap the cards in the same task, so the
      // next card is never painted off-screen and the old one never recentred.
      x.jump(0);
      y.jump(0);
      topOpacity.jump(1);
      flushSync(() => setSwiped((count) => count + 1));
      busy.current = false;
      crossed.current = { left: false, right: false };
      onSwipe?.(item, direction, index);
      if (loop || swiped + 1 < length) onIndexChange?.(positionOf(swiped + 1));
    };
    if (reduceMotion) {
      void animate(topOpacity, 0, { duration: 0.18, ease: "easeOut" }).then(land);
    } else {
      const distance = width.get() * 1.5;
      void animate(x, direction === "right" ? distance : -distance, FLY).then(land);
    }
  }

  function onDrag() {
    const dx = x.get();
    const limit = threshold();
    if (Math.abs(dx) < limit / 2) {
      crossed.current = { left: false, right: false };
    } else if (dx > limit && !crossed.current.right) {
      crossed.current.right = true;
      onThresholdCross?.("right");
    } else if (dx < -limit && !crossed.current.left) {
      crossed.current.left = true;
      onThresholdCross?.("left");
    }
  }

  function onDragEnd(_: unknown, info: PanInfo) {
    const dx = x.get();
    if (Math.abs(dx) > threshold() || Math.abs(info.velocity.x) > FLING) {
      commit(dx > 0 || (dx === 0 && info.velocity.x > 0) ? "right" : "left");
      return;
    }
    crossed.current = { left: false, right: false };
    const back = reduceMotion ? { duration: 0.15 } : SNAP;
    void animate(x, 0, back);
    void animate(y, 0, back);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      commit("left");
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      commit("right");
    } else if (event.key === "Enter" && current) {
      onCardPress?.(current);
    }
  }

  if (length === 0 || finished) return <>{empty}</>;

  const stack = [0, 1, 2]
    .map((depth) => ({ depth, absolute: swiped + depth, item: cardAt(swiped + depth) }))
    .filter((card): card is { depth: number; absolute: number; item: SwipeCardsItem } => card.item !== null);

  return (
    <div
      ref={rootRef}
      role="group"
      aria-roledescription="swipe deck"
      aria-label={label}
      aria-keyshortcuts="ArrowLeft ArrowRight"
      tabIndex={0}
      onKeyDown={onKeyDown}
      className={cn(
        "relative aspect-[37/65] w-full max-w-[370px] select-none rounded-[20px] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background",
        className,
      )}
    >
      <span className="sr-only" aria-live="polite">
        {current ? `${current.title}${current.price ? `, ${current.price}` : ""}. Left arrow: ${left}. Right arrow: ${right}.` : ""}
      </span>
      {stack
        .slice()
        .reverse()
        .map(({ depth, absolute, item }) => {
          const top = depth === 0;
          const style = motionFor[depth];
          return (
            <motion.div
              key={absolute}
              aria-hidden={top ? undefined : true}
              inert={!top}
              className={cn("absolute inset-x-0 top-[5%] h-[90%] rounded-[20px]", top && "cursor-grab active:cursor-grabbing")}
              style={{ ...style, zIndex: 10 - depth, touchAction: top ? "none" : undefined }}
              drag={top}
              dragControls={controls}
              dragListener={false}
              dragMomentum={false}
              onDrag={top ? onDrag : undefined}
              onDragStart={() => {
                dragged.current = true;
              }}
              onDragEnd={top ? onDragEnd : undefined}
              onPointerDown={(event) => {
                if (!top || busy.current) return;
                dragged.current = false;
                controls.start(event);
              }}
              onClick={() => {
                if (top && !dragged.current) onCardPress?.(item);
              }}
            >
              <Card
                item={item}
                variant={variant}
                left={left}
                right={right}
                effects={top ? effects : null}
                onLeft={() => commit("left")}
                onRight={() => commit("right")}
                onAddToBag={onAddToBag}
                addToBagLabel={addToBagLabel}
              />
            </motion.div>
          );
        })}
    </div>
  );
}

/** Keeps a press on a control from starting a drag or counting as a card tap. */
function guard(action: () => void) {
  return {
    onPointerDown: (event: React.PointerEvent) => event.stopPropagation(),
    onClick: (event: React.MouseEvent) => {
      event.stopPropagation();
      action();
    },
  };
}

function Card({
  item,
  variant,
  left,
  right,
  effects,
  onLeft,
  onRight,
  onAddToBag,
  addToBagLabel,
}: {
  item: SwipeCardsItem;
  variant: "feed" | "choice";
  left: string;
  right: string;
  effects: TopEffects | null;
  onLeft: () => void;
  onRight: () => void;
  onAddToBag?: (item: SwipeCardsItem) => void;
  addToBagLabel: string;
}) {
  const choice = variant === "choice";
  const details = item.condition ? `${item.condition}${item.size ? ` • ${item.size}` : ""}` : item.size;

  return (
    <div className="relative size-full overflow-hidden rounded-[20px] bg-tonal">
      {/* eslint-disable-next-line @next/next/no-img-element -- registry items are framework-agnostic */}
      <img src={item.image} alt="" draggable={false} className="pointer-events-none absolute inset-0 size-full object-cover" />

      {/* Stamps: the left action shows top right while leaning left, and vice versa. */}
      <motion.span
        aria-hidden="true"
        style={{ opacity: effects?.leftStamp ?? 0 }}
        className="pointer-events-none absolute top-4 right-4 z-20 rotate-[15deg] font-heading text-[44px] leading-none font-semibold text-destructive"
      >
        {left}
      </motion.span>
      <motion.span
        aria-hidden="true"
        style={{ opacity: effects?.rightStamp ?? 0 }}
        className={cn(
          "pointer-events-none absolute top-4 left-4 z-20 -rotate-[15deg] leading-none text-lead",
          choice ? "font-heading text-[44px] font-semibold" : "text-[64px]",
        )}
      >
        {choice ? right : "♥"}
      </motion.span>

      {onAddToBag ? (
        <button
          type="button"
          {...guard(() => onAddToBag(item))}
          className="absolute top-4 right-4 z-10 rounded-inset bg-secondary/80 px-3 py-2 font-body text-sm font-semibold text-secondary-foreground shadow-[0_2px_4px_var(--menu-shadow)] transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-menu-ink"
        >
          {addToBagLabel}
        </button>
      ) : null}

      {/* A blurred, darkened band rising from the bottom, under the details. */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[220px] backdrop-blur-[6px]"
          style={{
            maskImage: "linear-gradient(to bottom, transparent, black 30%)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent, black 30%)",
            backgroundImage:
              "linear-gradient(to bottom, transparent, color-mix(in srgb, var(--menu-shadow) 50%, transparent) 50%, var(--menu-shadow))",
          }}
        />
        <div className="relative p-5 pt-8">
          <div className="flex w-full items-start justify-between">
            <h3 className="mr-4 line-clamp-2 flex-1 font-heading text-[26px] leading-8 font-medium tracking-[-0.5px] text-menu-ink">
              {item.title}
            </h3>
            {item.price ? (
              <span className="shrink-0 self-start rounded-full bg-secondary px-3 py-1 font-body text-base font-bold whitespace-nowrap text-secondary-foreground">
                {item.price}
              </span>
            ) : null}
          </div>

          {choice && item.description ? (
            <p className="mt-1 mb-4 line-clamp-2 font-body text-base text-menu-dim">{item.description}</p>
          ) : item.brand || (!choice && details) ? (
            <div className="mt-2 mb-4 flex items-center justify-between gap-3">
              {item.brand ? (
                <span className="font-body text-sm font-semibold tracking-tighter text-menu-dim uppercase">{item.brand}</span>
              ) : (
                <span />
              )}
              {!choice && details ? (
                <span className="max-w-[180px] truncate rounded-full bg-tonal px-3 py-1.5 font-body text-sm font-medium text-on-tonal">
                  {details}
                </span>
              ) : null}
            </div>
          ) : (
            <div className="mb-4" />
          )}

          {choice ? (
            <div className="mt-2 flex items-center justify-center gap-4">
              <button
                type="button"
                aria-label={left}
                {...guard(onLeft)}
                className="relative flex items-center justify-center overflow-hidden rounded-full bg-tonal px-7 py-2 font-body text-lg font-semibold text-on-tonal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-menu-ink"
              >
                <motion.span
                  aria-hidden="true"
                  style={{ scaleX: effects?.leftPill ?? 0 }}
                  className="absolute inset-0 origin-right bg-stop/40"
                />
                <span className="relative flex items-center gap-2">
                  <X aria-hidden="true" className="size-[18px]" />
                  {left}
                </span>
              </button>
              <button
                type="button"
                aria-label={right}
                {...guard(onRight)}
                className="relative flex items-center justify-center overflow-hidden rounded-full bg-tonal px-7 py-2 font-body text-lg font-semibold text-on-tonal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-menu-ink"
              >
                <motion.span
                  aria-hidden="true"
                  style={{ scaleX: effects?.rightPill ?? 0 }}
                  className="absolute inset-0 origin-left bg-lead/45"
                />
                <span className="relative flex items-center gap-2">
                  <Check aria-hidden="true" className="size-[18px]" />
                  {right}
                </span>
              </button>
            </div>
          ) : (
            <div className="mt-2 flex items-center justify-center gap-4">
              <button
                type="button"
                aria-label={left}
                {...guard(onLeft)}
                className="relative flex size-[52px] items-center justify-center overflow-hidden rounded-full text-menu-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-menu-ink"
              >
                <motion.span
                  aria-hidden="true"
                  style={{ scaleY: effects?.leftFill ?? 0 }}
                  className="absolute inset-0 origin-bottom bg-destructive"
                />
                <X aria-hidden="true" className="relative size-[26px]" />
              </button>
              <button
                type="button"
                aria-label={right}
                {...guard(onRight)}
                className="relative flex size-[52px] items-center justify-center overflow-hidden rounded-full text-lead focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-menu-ink"
              >
                <motion.span
                  aria-hidden="true"
                  style={{ scaleY: effects?.rightFill ?? 0 }}
                  className="absolute inset-0 origin-bottom bg-menu-ink"
                />
                <Heart aria-hidden="true" className="relative size-[30px] fill-current" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SwipeCards;
