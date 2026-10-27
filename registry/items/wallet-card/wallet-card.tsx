"use client";

import * as React from "react";
import { animate, motion, useReducedMotionConfig } from "motion/react";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";

export interface WalletCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** The balance shown in the pocket. Counts up from zero when it appears. */
  balance: number;
  /** Prefix for the default formatter. Defaults to "₦". */
  currency?: string;
  /** Locale for the default formatter's digit grouping. Defaults to "en-NG". */
  locale?: string;
  /** Replaces the default `${currency}${balance.toLocaleString(locale)}`. */
  formatBalance?: (value: number) => string;
  /** Label above the balance. Defaults to "Available to Withdraw". */
  balanceLabel?: React.ReactNode;
  /** Whether the balance starts visible. Defaults to true. */
  defaultBalanceVisible?: boolean;
  /** Called when the eye toggle shows or hides the balance. */
  onBalanceVisibleChange?: (visible: boolean) => void;
  /** Shows a placeholder bar instead of the balance. */
  loading?: boolean;
  /** Name on the card, as printed. Defaults to "MEMBER". */
  holderName?: string;
  /** The characters after the masked dots. Defaults to "8888". */
  cardNumberSuffix?: string;
  /** The mark in the card's top-right corner. Defaults to "Steeze". */
  brand?: React.ReactNode;
  /** Artwork printed on the card, shown under a veil. Optional. */
  cardImage?: string;
  /** Texture for the wallet's leather, shown under a veil. Optional. */
  leatherImage?: string;
  /** Called when the card is tapped, with whether it is now pulled up. */
  onCardPress?: (pulledUp: boolean) => void;
  /**
   * `dark` (default) keeps the wallet a dark leather object in light mode too,
   * as in the app, by scoping the theme's dark tokens to it. `auto` follows the page.
   */
  tone?: "dark" | "auto";
}

// Pocket geometry, in pixels, as drawn in the app.
const H = 200; // pocket height
const R = 24; // corner radius
const D = 20; // depth of the scoop's start below the top
const SCOOP_START = 130; // where the scoop leaves each edge
const INSET = 10; // stitched inner panel
const DEFAULT_WIDTH = 342; // a 390pt phone less the screen's 24px gutters
const CARD_REVEAL = 96; // Clear both holder lines above the pocket, with 8px to spare.
const CARD_TOP_PADDING = 68; // Leave 4px above the card at its fully raised position.

const EASE_OUT_CUBIC = [0.33, 1, 0.68, 1] as const;
const EASE_IN_OUT_CUBIC = [0.65, 0, 0.35, 1] as const;
const EASE_IN_OUT_QUAD = [0.45, 0, 0.55, 1] as const;
const EASE_OUT = [0, 0, 0.58, 1] as const;

/**
 * The app's greys are charcoal with a little light mixed in, so they are
 * written as ink mixed into ground: exact in Steeze's dark mode, and they
 * follow any theme's ground and ink elsewhere.
 */
const lift = (percent: number) => `color-mix(in srgb, var(--ink) ${percent}%, var(--ground))`;
const SHADE = {
  back: lift(13), // the wallet's back panel veil
  pocketTop: lift(13),
  pocketBottom: lift(4),
  inner: lift(8), // the stitched panel, darker inside the stitching
  leather: lift(5.3), // veil over the leather texture
  rivetCap: lift(4),
  stitch: "color-mix(in srgb, var(--ink) 10%, transparent)",
  // The card's gold chip: the theme's yellow, softened toward ink.
  chip: "color-mix(in srgb, color-mix(in srgb, var(--milestone-yellow) 40%, var(--ink)) 90%, var(--ground))",
  chipEdge: "color-mix(in srgb, color-mix(in srgb, var(--milestone-yellow) 65%, var(--ink)) 76%, var(--ground))",
};

function outerPocket(w: number) {
  return [
    `M 0 ${R + D}`,
    `Q 0 ${D}, ${R} ${D}`,
    `H ${SCOOP_START}`,
    `Q ${w * 0.5} ${D + 40}, ${w - SCOOP_START} ${D}`,
    `H ${w - R}`,
    `Q ${w} ${D}, ${w} ${R + D}`,
    `V ${H - R}`,
    `Q ${w} ${H}, ${w - R} ${H}`,
    `H ${R}`,
    `Q 0 ${H}, 0 ${H - R}`,
    "Z",
  ].join(" ");
}

function innerPocket(w: number) {
  const top = D + INSET + 5;
  return [
    `M ${INSET} ${R + D + 5}`,
    `Q ${INSET} ${top}, ${R + 2} ${top}`,
    `H ${SCOOP_START - 8}`,
    `Q ${w * 0.5} ${D + 48}, ${w - SCOOP_START + 8} ${top}`,
    `H ${w - R - 2}`,
    `Q ${w - INSET} ${top}, ${w - INSET} ${R + D + 5}`,
    `V ${H - R - INSET}`,
    `Q ${w - INSET} ${H - INSET}, ${w - R - 2} ${H - INSET}`,
    `H ${R + 2}`,
    `Q ${INSET} ${H - INSET}, ${INSET} ${H - R - INSET}`,
    "Z",
  ].join(" ");
}

/** The balance counts up from zero over 900ms each time it is shown. */
function CountUp({ value, format, still }: { value: number; format: (value: number) => string; still: boolean }) {
  const [shown, setShown] = React.useState(0);
  React.useEffect(() => {
    if (still) return;
    const controls = animate(0, value, {
      duration: 0.9,
      ease: EASE_OUT,
      onUpdate: (latest) => setShown(Math.floor(latest)),
      onComplete: () => setShown(value),
    });
    return () => controls.stop();
  }, [value, still]);
  return <>{format(still ? value : shown)}</>;
}

/**
 * Steeze's earnings wallet: a payment card that slides down into a stitched
 * leather pocket and peeks out above it. Tap the card to pull it up and show
 * the rest; tap again to tuck it back. The pocket holds the balance, which
 * counts up when it appears and hides behind an eye toggle.
 *
 * Every colour is a theme token. The app's charcoal greys are ink mixed into
 * ground, so in Steeze's dark mode it matches the app, and in a light theme
 * it becomes a light wallet with dark type. The card and leather textures are
 * optional images; without them the card and pocket are flat shades.
 */
export function WalletCard({
  balance,
  currency = "₦",
  locale = "en-NG",
  formatBalance,
  balanceLabel = "Available to Withdraw",
  defaultBalanceVisible = true,
  onBalanceVisibleChange,
  loading = false,
  holderName = "MEMBER",
  cardNumberSuffix = "8888",
  brand = "Steeze",
  cardImage,
  leatherImage,
  onCardPress,
  tone = "dark",
  className,
  style,
  ...props
}: WalletCardProps) {
  const reduceMotion = useReducedMotionConfig() ?? false;
  const [visible, setVisible] = React.useState(defaultBalanceVisible);
  const [pulledUp, setPulledUp] = React.useState(false);
  const [touched, setTouched] = React.useState(false);
  const [width, setWidth] = React.useState(DEFAULT_WIDTH);
  const pocketRef = React.useRef<HTMLDivElement>(null);
  const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const ids = {
    pocketGrad: `${uid}-pocket-grad`,
    innerGrad: `${uid}-inner-grad`,
    pocketClip: `${uid}-pocket-clip`,
  };

  // The pocket's curves are drawn in pixels, so redraw them at the real width.
  React.useEffect(() => {
    const node = pocketRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const format = formatBalance ?? ((value: number) => `${currency}${value.toLocaleString(locale)}`);
  const outer = outerPocket(width);
  const inner = innerPocket(width);
  const rivets = [SCOOP_START - 67, width - SCOOP_START + 67];

  // The card slides in from above after 300ms; later taps move it in 300ms.
  const transition = reduceMotion
    ? { duration: 0 }
    : touched
      ? { y: { duration: 0.3, ease: EASE_IN_OUT_CUBIC }, opacity: { duration: 0 } }
      : {
          y: { delay: 0.3, duration: 0.8, ease: EASE_OUT_CUBIC },
          opacity: { delay: 0.3, duration: 0.4, ease: EASE_IN_OUT_QUAD },
        };

  function pressCard() {
    const next = !pulledUp;
    setTouched(true);
    setPulledUp(next);
    onCardPress?.(next);
  }

  function toggleBalance() {
    const next = !visible;
    setVisible(next);
    onBalanceVisibleChange?.(next);
  }

  return (
    <div className={cn("relative w-full font-body", tone === "dark" && "dark", className)} style={{ paddingTop: CARD_TOP_PADDING, ...style }} {...props}>
      {/* The wallet's back panel, behind the card. */}
      <div
        aria-hidden="true"
        className={cn("absolute bottom-0 left-0 w-[98.5%] overflow-hidden rounded-[24px] bg-cover bg-center", !leatherImage && "bg-ground")}
        style={{ top: CARD_TOP_PADDING - 2, backgroundImage: leatherImage ? `url(${leatherImage})` : undefined }}
      >
        <div className="size-full opacity-70" style={{ background: SHADE.back }} />
      </div>

      {/* The card, peeking out of the pocket. */}
      <motion.div
        className="relative mx-4 mt-8 overflow-hidden rounded-panel"
        initial={reduceMotion ? false : { y: -100, opacity: 0 }}
        animate={{ y: pulledUp ? -CARD_REVEAL : 0, opacity: 1 }}
        transition={transition}
      >
        <motion.button
          type="button"
          onClick={pressCard}
          aria-pressed={pulledUp}
          aria-label={`Card ending ${cardNumberSuffix}, ${pulledUp ? "tuck the card back" : "pull the card up"}`}
          whileTap={{ opacity: 0.95 }}
          className={cn(
            "relative flex h-[180px] w-full cursor-pointer flex-col bg-cover bg-center text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
            !cardImage && "bg-paper-sunk",
          )}
          style={{ backgroundImage: cardImage ? `url(${cardImage})` : undefined }}
        >
          <span aria-hidden="true" className="absolute inset-0 bg-ground/50" />
          <span aria-hidden="true" className="relative flex w-full shrink-0 flex-row items-start justify-between px-8 py-4">
            <span
              className="relative h-8 w-10 overflow-hidden rounded-[4px] border"
              style={{ background: SHADE.chip, borderColor: SHADE.chipEdge }}
            >
              {[
                "top-0 left-1/2 h-full w-px",
                "top-0 left-1/4 h-full w-px",
                "top-1/2 left-0 h-px w-full",
                "top-1/4 left-0 h-px w-full",
                "top-[18.5px] left-0 h-px w-full",
              ].map((line) => (
                <span
                  key={line}
                  className={cn("absolute", line)}
                  style={{ background: `color-mix(in srgb, ${SHADE.chipEdge} 50%, transparent)` }}
                />
              ))}
              <span
                className="absolute top-1/2 left-1/2 size-4 -translate-x-2 -translate-y-2 rounded-[2px] border"
                style={{ borderColor: `color-mix(in srgb, ${SHADE.chipEdge} 50%, transparent)` }}
              />
            </span>
            <span className="font-heading text-2xl tracking-tighter text-ink">{brand}</span>
          </span>
          <span aria-hidden="true" className="relative mt-4 mb-4 flex w-full shrink-0 flex-row items-center justify-center">
            <span className="text-xl font-bold tracking-[4px] whitespace-pre text-ink">{"••••  "}</span>
            <span className="font-mono text-xl tracking-[4px] text-ink">{cardNumberSuffix}</span>
          </span>
          <span aria-hidden="true" className="relative mt-2 flex w-full shrink-0 flex-col px-8">
            <span className="text-xs font-medium tracking-tight text-ink/50">CARD HOLDER</span>
            <span className="text-sm font-medium text-ink/90">{holderName}</span>
          </span>
        </motion.button>
      </motion.div>

      {/* The pocket, in front of the card. */}
      <div ref={pocketRef} className="relative w-full" style={{ height: H, marginTop: -120 }}>
        <svg aria-hidden="true" width={width} height={H} viewBox={`0 0 ${width} ${H}`} className="absolute top-0 left-0">
          <defs>
            <linearGradient id={ids.pocketGrad} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={SHADE.pocketTop} />
              <stop offset="1" stopColor={SHADE.pocketBottom} />
            </linearGradient>
            <linearGradient id={ids.innerGrad} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={SHADE.inner} stopOpacity="0.5" />
              <stop offset="1" stopColor={SHADE.inner} stopOpacity="0.8" />
            </linearGradient>
            <clipPath id={ids.pocketClip}>
              <path d={outer} />
            </clipPath>
          </defs>

          {leatherImage ? (
            // In the app the texture covers the pocket and its stitched panel alike.
            <g clipPath={`url(#${ids.pocketClip})`}>
              <image href={leatherImage} x="0" y="0" width={width} height={H} preserveAspectRatio="xMidYMid slice" />
              <rect x="0" y="0" width={width} height={H} fill={SHADE.leather} fillOpacity="0.85" />
            </g>
          ) : (
            <>
              <path d={outer} fill={`url(#${ids.pocketGrad})`} />
              <path d={inner} fill={`url(#${ids.innerGrad})`} />
            </>
          )}

          {rivets.map((cx) => (
            <g key={cx}>
              <circle cx={cx} cy={D + 35} r="8" fill="var(--ground)" />
              <circle cx={cx} cy={D + 32} r="4" fill={SHADE.rivetCap} />
            </g>
          ))}
          <path d={inner} fill="none" stroke={SHADE.stitch} strokeWidth="1.5" strokeDasharray="5, 4" />
        </svg>

        {/* The balance, at the foot of the pocket. */}
        <div className="absolute inset-0 flex flex-col justify-between px-6 pt-24 pb-6">
          <div />
          <div className="flex flex-row items-center justify-between">
            <div>
              <div className="mb-1 flex flex-row items-center gap-4">
                <span className="text-base font-medium tracking-tight text-ink/50">{balanceLabel}</span>
                <button
                  type="button"
                  onClick={toggleBalance}
                  aria-pressed={!visible}
                  aria-label={visible ? "Hide balance" : "Show balance"}
                  className="cursor-pointer rounded-[4px] text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {visible ? <EyeOff aria-hidden="true" className="size-5" /> : <Eye aria-hidden="true" className="size-5" />}
                </button>
              </div>
              {loading ? (
                <div className="h-10 w-40 rounded-[4px] bg-ink/10" />
              ) : (
                <div className="text-3xl font-bold text-ink">
                  {/* Screen readers get the settled figure, not every step of the count. */}
                  <span className="sr-only">{visible ? format(balance) : "Balance hidden"}</span>
                  <span aria-hidden="true">
                    {visible ? <CountUp value={balance} format={format} still={reduceMotion} /> : "********"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WalletCard;
