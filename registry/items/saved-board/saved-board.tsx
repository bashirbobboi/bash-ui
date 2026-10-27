"use client";
/* eslint-disable @next/next/no-img-element -- Portable registry component; covers are passed as image URLs. */

import * as React from "react";
import { motion, useReducedMotionConfig } from "motion/react";
import { Bookmark } from "lucide-react";

import { cn } from "@/lib/utils";

export type SavedBoardImage = string | { src: string; alt?: string };

export interface SavedBoardProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "title" | "children"> {
  /** The board's name, on the glass. */
  title: string;
  /** Up to five cover images; they fan out of the card behind the glass. */
  images: SavedBoardImage[];
  /** How many items the board holds. Defaults to the number of images. */
  itemCount?: number;
  /** Shown after the item count when given: "12 items • 1,204 views". */
  views?: number;
  /** Who made the board: a small avatar and name under the title. */
  owner?: { name: string; avatarSrc?: string };
  /** Card width in pixels; the card is 1.15 times as tall. Defaults to 228. */
  size?: number;
  /** Makes the card a link. */
  href?: string;
  onClick?: React.MouseEventHandler<HTMLElement>;
}

type Fan = {
  idx: number;
  left?: number;
  right?: number;
  bottom: number;
  rotate: number;
  w: number;
  h: number;
  z: number;
  /** Which float curve the image rides, so neighbours never bob in step. */
  float: number;
};

/** Per fan position: leg duration (ms), amplitude (px) and start delay (ms). */
const FLOAT_MS = [1400, 1700, 1200, 1600, 2000];
const FLOAT_PX = [3.5, 4, 3, 4.5, 3.5];
const FLOAT_DELAY = [0, 300, 150, 450, 200];

/** The fan for one to five images, in fractions of the card width. Centre images sit in flow. */
function fan(count: number, S: number): Fan[] {
  if (count === 1) return [{ idx: 0, float: 0, bottom: 6, rotate: 0, w: S * 0.44, h: S * 0.56, z: 1 }];
  if (count === 2)
    return [
      { idx: 0, float: 0, left: S * 0.1, bottom: -4, rotate: -12, w: S * 0.4, h: S * 0.52, z: 1 },
      { idx: 1, float: 1, right: S * 0.1, bottom: -4, rotate: 12, w: S * 0.4, h: S * 0.52, z: 1 },
    ];
  if (count === 3)
    return [
      { idx: 1, float: 0, left: S * 0.06, bottom: -8, rotate: -15, w: S * 0.36, h: S * 0.48, z: 1 },
      { idx: 0, float: 1, bottom: 6, rotate: 0, w: S * 0.42, h: S * 0.54, z: 2 },
      { idx: 2, float: 2, right: S * 0.06, bottom: -8, rotate: 15, w: S * 0.36, h: S * 0.48, z: 1 },
    ];
  if (count === 4)
    return [
      { idx: 1, float: 0, left: S * 0.01, bottom: -10, rotate: -20, w: S * 0.32, h: S * 0.42, z: 1 },
      { idx: 2, float: 1, left: S * 0.14, bottom: -4, rotate: -8, w: S * 0.36, h: S * 0.48, z: 2 },
      { idx: 3, float: 2, right: S * 0.14, bottom: -4, rotate: 8, w: S * 0.36, h: S * 0.48, z: 2 },
      { idx: 0, float: 3, right: S * 0.01, bottom: -10, rotate: 20, w: S * 0.32, h: S * 0.42, z: 1 },
    ];
  if (count >= 5)
    return [
      { idx: 3, float: 0, left: S * -0.02, bottom: -12, rotate: -24, w: S * 0.3, h: S * 0.4, z: 1 },
      { idx: 1, float: 1, left: S * 0.1, bottom: -6, rotate: -12, w: S * 0.34, h: S * 0.44, z: 2 },
      { idx: 0, float: 2, bottom: 6, rotate: 0, w: S * 0.4, h: S * 0.52, z: 3 },
      { idx: 2, float: 3, right: S * 0.1, bottom: -6, rotate: 12, w: S * 0.34, h: S * 0.44, z: 2 },
      { idx: 4, float: 4, right: S * -0.02, bottom: -12, rotate: 24, w: S * 0.3, h: S * 0.4, z: 1 },
    ];
  return [];
}

function toImage(image: SavedBoardImage) {
  return typeof image === "string" ? { src: image, alt: "" } : { alt: "", ...image };
}

/**
 * Steeze's suggested-board card: a board's covers fan out of a frosted pocket
 * like photos from a folder, each one bobbing gently on its own beat, with the
 * board's name, owner and count printed on the glass.
 *
 * The glass is ink at 45% under a light blur, and its text is on-solid, so it
 * reads light-on-dark pages and dark-on-light ones. Reduced motion holds the
 * covers still.
 */
export function SavedBoard({
  title,
  images,
  itemCount,
  views,
  owner,
  size = 228,
  href,
  onClick,
  className,
  style,
  ...props
}: SavedBoardProps) {
  const reduceMotion = useReducedMotionConfig();
  const covers = images.slice(0, 5).map(toImage);
  const items = fan(covers.length, size);
  const count = itemCount ?? images.length;

  const body = (
    <>
      {/* The fan: the top 60%, images anchored to its bottom edge so they dip behind the glass. */}
      <div className="absolute inset-x-0 top-0 z-0 flex h-[60%] items-end justify-center">
        {covers.length > 0 ? (
          items.map((item) => {
            const centred = item.left === undefined && item.right === undefined;
            const amplitude = FLOAT_PX[item.float];
            const cover = covers[item.idx];
            return (
              <motion.div
                key={item.idx}
                className={cn(centred ? "relative" : "absolute")}
                style={{ left: item.left, right: item.right, bottom: item.bottom, zIndex: item.z }}
                // Rotate first, then bob along the rotated axis, as the app composes it.
                transformTemplate={({ y }) => `rotate(${item.rotate}deg) translateY(${y ?? "0px"})`}
                initial={{ y: 0 }}
                animate={reduceMotion ? { y: 0 } : { y: [0, -amplitude, amplitude, -amplitude, 0] }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : {
                        // Reanimated's reversing repeat: up, down, up, back to rest, one leg each.
                        duration: (FLOAT_MS[item.float] * 4) / 1000,
                        times: [0, 0.25, 0.5, 0.75, 1],
                        ease: "easeInOut",
                        delay: FLOAT_DELAY[item.float] / 1000,
                        repeat: Infinity,
                        repeatType: "loop",
                      }
                }
              >
                <div className="overflow-hidden rounded-md bg-card shadow-md" style={{ width: item.w, height: item.h }}>
                  <img src={cover.src} alt={cover.alt} draggable={false} className="size-full object-cover" />
                </div>
              </motion.div>
            );
          })
        ) : (
          <div
            className="flex items-center justify-center rounded-md bg-paper-sunk text-faint"
            style={{ width: size * 0.42, height: size * 0.52 }}
          >
            <Bookmark className="size-6" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* The pocket: frosted glass over the bottom 55%. */}
      <div className="absolute inset-x-0 bottom-0 z-[1] h-[55%] overflow-hidden rounded-2xl bg-ink/45 shadow-lg backdrop-blur-[6px]" />

      <div className="absolute inset-x-0 bottom-0 z-[2] flex h-[55%] flex-col items-center justify-end px-4 pt-4 pb-3.5 text-on-solid">
        <p className="mb-1.5 w-full truncate text-center font-heading text-[17px] font-medium tracking-tighter">
          {title}
        </p>
        {owner ? (
          <span className="mb-1 flex items-center justify-center">
            {owner.avatarSrc ? (
              <img src={owner.avatarSrc} alt="" className="size-[18px] shrink-0 rounded-full object-cover" />
            ) : (
              <span
                aria-hidden="true"
                className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-on-solid/15 font-body text-[10px] font-semibold"
              >
                {owner.name.slice(0, 1).toUpperCase()}
              </span>
            )}
            <span
              className="ml-1.5 truncate font-body text-xs font-semibold tracking-tighter text-on-solid/75"
              style={{ maxWidth: size * 0.5 }}
            >
              {owner.name}
            </span>
          </span>
        ) : null}
        <p className="text-center font-heading text-[11px] font-bold text-on-solid/50">
          {count} {count === 1 ? "item" : "items"}
          {typeof views === "number" ? (
            <>
              <span className="mx-1">•</span>
              {views.toLocaleString()} {views === 1 ? "view" : "views"}
            </>
          ) : null}
        </p>
      </div>
    </>
  );

  const shared = {
    className: cn(
      "relative block shrink-0 touch-manipulation text-left transition-opacity duration-150 select-none active:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
      (href || onClick) && "cursor-pointer",
      className,
    ),
    style: { width: size, height: size * 1.15, ...style },
  };

  if (href) {
    return (
      <a href={href} onClick={onClick} {...shared} {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {body}
      </a>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} {...shared} {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}>
        {body}
      </button>
    );
  }
  return (
    <div {...shared} {...props}>
      {body}
    </div>
  );
}

export default SavedBoard;
