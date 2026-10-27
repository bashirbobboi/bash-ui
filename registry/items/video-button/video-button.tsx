"use client";

import * as React from "react";
import { useReducedMotion, useReducedMotionConfig } from "motion/react";

import { cn } from "@/lib/utils";

export type VideoButtonSize = "sm" | "md" | "lg";

export type VideoButtonMediaType = "video" | "image";

interface BaseProps {
  /** The label. Defaults to "Get in touch". */
  label?: React.ReactNode;
  /** A looping clip (mp4, webm) or an image or GIF, revealed behind the label. */
  mediaSrc: string;
  /** Overrides detection from the file extension (mp4, webm, mov and m4v are video). */
  mediaType?: VideoButtonMediaType;
  /** Video only: the frame shown before playback, and the still under reduced motion. */
  poster?: string;
  size?: VideoButtonSize;
  className?: string;
}

type AnchorProps = BaseProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "children" | keyof BaseProps> & {
    /** Given, the button renders as an `<a>`; otherwise as a `<button>`. */
    href: string;
  };

type ButtonProps = BaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children" | keyof BaseProps> & {
    href?: undefined;
  };

export type VideoButtonProps = AnchorProps | ButtonProps;

const SIZES = {
  sm: "h-10 rounded-xl px-5 text-sm",
  md: "h-11 rounded-2xl px-6 text-base",
  lg: "h-13 rounded-2xl px-6 text-lg",
} as const;

const SHELL =
  "group/media relative isolate inline-flex cursor-pointer touch-manipulation items-center justify-center overflow-hidden bg-media-rest-fill font-heading font-semibold whitespace-nowrap no-underline shadow-lg select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50";

/**
 * Where the media is always shown: screens without hover and narrow screens,
 * where there is no other way to see it. The class and the playback effect
 * use the same query.
 */
const ALWAYS_SHOWN_QUERY = "(hover: none), (max-width: 767px)";

/** Shown on hover and keyboard focus, and always where ALWAYS_SHOWN_QUERY matches. */
const REVEAL =
  "opacity-0 transition-opacity duration-300 group-hover/media:opacity-100 group-focus-visible/media:opacity-100 [@media(hover:none)]:opacity-100 max-md:opacity-100 motion-reduce:transition-none";

const VIDEO_EXTENSION = /\.(mp4|webm|mov|m4v)(?:[?#]|$)/i;

function subscribeToHydration() {
  return () => {};
}

/**
 * A button that reveals a looping clip or GIF behind its label on hover.
 * Its resting fill and label follow the theme. Over footage, a dark scrim
 * and light label keep the text readable in either mode.
 *
 * Video plays only while it can be seen: on hover or focus where there is a
 * pointer that hovers, and while on screen where there is not. Under reduced
 * motion a video holds its first frame (or `poster`) and a GIF, which cannot
 * be paused, is not shown at all.
 */
export function VideoButton({
  label = "Get in touch",
  mediaSrc,
  mediaType,
  poster,
  size = "lg",
  className,
  ...props
}: VideoButtonProps) {
  const configuredReduce = useReducedMotionConfig();
  const prefersReducedMotion = useReducedMotion();
  const hydrated = React.useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const reduce = hydrated && Boolean(configuredReduce || prefersReducedMotion);
  const kind: VideoButtonMediaType = mediaType ?? (VIDEO_EXTENSION.test(mediaSrc) ? "video" : "image");
  const showMedia = !(reduce && kind === "image");

  const rootRef = React.useRef<HTMLElement | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    const root = rootRef.current;
    const video = videoRef.current;
    if (!root || !video || reduce) return;
    video.muted = true;
    const play = () => {
      video.play().catch(() => {});
    };
    const pause = () => video.pause();

    if (window.matchMedia(ALWAYS_SHOWN_QUERY).matches) {
      const observer = new IntersectionObserver(([entry]) => (entry.isIntersecting ? play() : pause()));
      observer.observe(root);
      return () => {
        observer.disconnect();
        pause();
      };
    }

    root.addEventListener("pointerenter", play);
    root.addEventListener("pointerleave", pause);
    root.addEventListener("focusin", play);
    root.addEventListener("focusout", pause);
    return () => {
      root.removeEventListener("pointerenter", play);
      root.removeEventListener("pointerleave", pause);
      root.removeEventListener("focusin", play);
      root.removeEventListener("focusout", pause);
      pause();
    };
  }, [reduce, kind, mediaSrc]);

  const classes = cn(SHELL, SIZES[size], className);

  const body = (
    <>
      {showMedia ? (
        <>
          {kind === "video" ? (
            <video
              ref={videoRef}
              src={mediaSrc}
              poster={poster}
              muted
              loop
              playsInline
              preload="auto"
              aria-hidden="true"
              tabIndex={-1}
              className={cn("pointer-events-none absolute inset-0 -z-10 size-full object-cover", REVEAL)}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- ships to any React app, not only Next
            <img
              src={mediaSrc}
              alt=""
              aria-hidden="true"
              className={cn("pointer-events-none absolute inset-0 -z-10 size-full object-cover", REVEAL)}
            />
          )}
          <span aria-hidden="true" className={cn("pointer-events-none absolute inset-0 -z-10 bg-media-fill/50", REVEAL)} />
        </>
      ) : null}
      <span className={cn(
        "relative text-media-rest-ink transition-colors duration-300 motion-reduce:transition-none",
        showMedia && "group-hover/media:text-on-media group-focus-visible/media:text-on-media [@media(hover:none)]:text-on-media max-md:text-on-media group-hover/media:[text-shadow:0_1.2px_1.2px_color-mix(in_srgb,var(--media-fill)_80%,transparent)] group-focus-visible/media:[text-shadow:0_1.2px_1.2px_color-mix(in_srgb,var(--media-fill)_80%,transparent)] [@media(hover:none)]:[text-shadow:0_1.2px_1.2px_color-mix(in_srgb,var(--media-fill)_80%,transparent)] max-md:[text-shadow:0_1.2px_1.2px_color-mix(in_srgb,var(--media-fill)_80%,transparent)]",
      )}>
        {label}
      </span>
    </>
  );

  if (props.href !== undefined) {
    return (
      <a
        ref={rootRef as React.Ref<HTMLAnchorElement>}
        className={classes}
        {...(props as Omit<AnchorProps, keyof BaseProps>)}
      >
        {body}
      </a>
    );
  }

  const { type = "button", ...rest } = props as Omit<ButtonProps, keyof BaseProps>;
  return (
    <button ref={rootRef as React.Ref<HTMLButtonElement>} type={type} className={classes} {...rest}>
      {body}
    </button>
  );
}

export default VideoButton;
