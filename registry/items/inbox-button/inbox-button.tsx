"use client";

import * as React from "react";
import { motion, useReducedMotionConfig, type Variants } from "motion/react";

import { cn } from "@/lib/utils";

/**
 * The provider's four colours, for the rail along the bottom edge and the
 * glyph. Each default reads a variable the consumer may set (Google's own
 * colours, say) and falls back to a contract token, so the button renders in
 * any theme with nothing set.
 */
export const DEFAULT_PROVIDER_COLORS = [
  "var(--provider-blue, var(--lead))",
  "var(--provider-red, var(--stop))",
  "var(--provider-yellow, var(--hold))",
  "var(--provider-green, var(--go))",
] as const;

export type ProviderColors = readonly [string, string, string, string];

/** The tray dips and settles. */
const tray: Variants = {
  normal: { y: 0 },
  animate: {
    y: [0, 2, -1, 0],
    transition: { duration: 0.6, times: [0, 0.4, 0.7, 1], ease: "easeInOut" },
  },
};

/** The tray's lip redraws itself, as if a letter just landed. */
const lip: Variants = {
  normal: { pathLength: 1, opacity: 1 },
  animate: {
    pathLength: [0, 1],
    opacity: [0, 1],
    transition: { duration: 0.45, delay: 0.15, ease: [0.16, 1, 0.3, 1] },
  },
};

/** Lucide's inbox glyph, with the tray-drop animation. */
function InboxGlyph({ active }: { active: boolean }) {
  return (
    <motion.svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={20}
      height={20}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5 shrink-0"
      variants={tray}
      initial="normal"
      animate={active ? "animate" : "normal"}
    >
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
      <motion.polyline points="22 12 16 12 14 15 10 15 8 12 2 12" variants={lip} />
    </motion.svg>
  );
}

export interface InboxButtonProps {
  /** Where the inbox lives. Renders an `<a>`; omit it and pass `onClick` for a `<button>`. */
  href?: string;
  onClick?: React.MouseEventHandler<HTMLElement>;
  /** Defaults to "View inbox". */
  label?: React.ReactNode;
  /** Unread messages. Shown as a small count after the label when above zero. */
  unreadCount?: number;
  /** Counts above this read as "99+". Defaults to 99. */
  maxCount?: number;
  /**
   * The provider's four colours: rail segments in order, the first also the
   * glyph at rest and the second the glyph on hover. Any CSS colour.
   */
  providerColors?: ProviderColors;
  className?: string;
}

/**
 * A shortcut to a shared inbox. The whole button drives the glyph's animation,
 * so the response belongs to the target rather than the few pixels of the
 * icon. The mail provider is present as a slim four-colour rail rather than
 * its logo: this opens your inbox experience, not the provider's screen.
 * Reduced-motion users keep the colour response without the animated glyph.
 */
export function InboxButton({
  href,
  onClick,
  label = "View inbox",
  unreadCount = 0,
  maxCount = 99,
  providerColors = DEFAULT_PROVIDER_COLORS,
  className,
}: InboxButtonProps) {
  const reduceMotion = useReducedMotionConfig();
  const [active, setActive] = React.useState(false);

  const start = () => setActive(true);
  const stop = () => setActive(false);

  const [blue, red, yellow, green] = providerColors;
  const unread = unreadCount > 0;
  const countText = unreadCount > maxCount ? `${maxCount}+` : String(unreadCount);

  const shared = {
    onClick,
    onMouseEnter: start,
    onMouseLeave: stop,
    onFocus: start,
    onBlur: stop,
    style: { "--inbox-rest": blue, "--inbox-hover": red } as React.CSSProperties,
    className: cn(
      "group relative isolate inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2.5 overflow-hidden rounded-inset border border-rule bg-card px-5 font-body text-sm font-semibold tracking-[-0.02em] text-ink transition-colors hover:bg-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lead",
      className,
    ),
  };

  const content = (
    <>
      <span className="text-(--inbox-rest) transition-colors duration-200 group-hover:text-(--inbox-hover) group-focus-visible:text-(--inbox-hover)">
        <InboxGlyph active={active && !reduceMotion} />
      </span>
      {label}
      {unread && (
        <span className="-mr-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-lead px-1.5 text-[11px] leading-none font-semibold tabular-nums text-on-solid">
          {countText}
          <span className="sr-only"> unread</span>
        </span>
      )}

      {/* A four-colour hairline, not a layout. */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 grid h-0.5 grid-cols-4 opacity-70 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        <span style={{ backgroundColor: blue }} />
        <span style={{ backgroundColor: red }} />
        <span style={{ backgroundColor: yellow }} />
        <span style={{ backgroundColor: green }} />
      </span>
    </>
  );

  if (href !== undefined) {
    return (
      <a href={href} {...shared}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" {...shared}>
      {content}
    </button>
  );
}

export default InboxButton;
