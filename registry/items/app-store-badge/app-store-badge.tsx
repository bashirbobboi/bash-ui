import * as React from "react";

import { cn } from "@/lib/utils";

export type Store = "app-store" | "google-play";

export interface AppStoreBadgeProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "children" | "href"> {
  /** Which store the badge sends people to. */
  store: Store;
  /** The app's listing on that store. */
  href: string;
  /** `solid`: an ink fill. `outline`: an ink hairline that fills on hover. */
  variant?: "solid" | "outline";
  /** Corners: the theme's inset radius or a full pill. */
  shape?: "inset" | "pill";
  /** Open the listing in a new tab. Defaults to true. */
  newTab?: boolean;
}

// Monochrome brand glyphs from Simple Icons (CC0-1.0), 24×24.
const GLYPHS: Record<Store, string> = {
  "app-store":
    "M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701",
  "google-play":
    "M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202a1.49 1.49 0 0 1 0 2.594zM1.337.924a1.486 1.486 0 0 0-.112.568v21.017c0 .217.045.419.124.6l11.155-11.087L1.337.924zm12.207 10.065l3.258-3.238L3.45.195a1.466 1.466 0 0 0-.946-.179l11.04 10.973zm0 2.067l-11 10.933c.298.036.612-.016.906-.183l13.324-7.54-3.23-3.21z",
};

/** The stores' own wording, so the badge reads the way people expect. */
const WORDING: Record<Store, { lead: string; name: string }> = {
  "app-store": { lead: "Download on the", name: "App Store" },
  "google-play": { lead: "Get it on", name: "Google Play" },
};

/**
 * A link to an app's store listing, drawn as a two-line badge: the store's
 * glyph, a small lead-in and the store's name. One badge per store; set two
 * side by side for both. Colours come from the theme, so it sits on any page.
 */
export function AppStoreBadge({
  store,
  href,
  variant = "solid",
  shape = "inset",
  newTab = true,
  className,
  ...props
}: AppStoreBadgeProps) {
  const { lead, name } = WORDING[store];

  return (
    <a
      href={href}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noopener noreferrer" : undefined}
      aria-label={`${lead} ${name}${newTab ? " (opens in a new tab)" : ""}`}
      className={cn(
        "inline-flex h-12 shrink-0 touch-manipulation items-center gap-2.5 border border-ink font-body no-underline transition-colors duration-200 select-none motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        variant === "solid"
          ? "bg-ink text-on-solid hover:bg-ink/85"
          : "bg-transparent text-ink hover:bg-ink hover:text-on-solid",
        shape === "pill" ? "rounded-full pr-6 pl-5" : "rounded-inset pr-5 pl-3.5",
        className,
      )}
      {...props}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className={cn("shrink-0 fill-current", store === "app-store" ? "size-[26px] -mt-0.5" : "size-[22px]")}>
        <path d={GLYPHS[store]} />
      </svg>
      <span className="flex flex-col items-start" aria-hidden="true">
        <span className={cn("text-[10px] leading-none font-medium", store === "google-play" && "tracking-[0.06em] uppercase")}>{lead}</span>
        <span className="text-[19px] leading-[1.15] font-semibold tracking-[-0.02em]">{name}</span>
      </span>
    </a>
  );
}

export default AppStoreBadge;
