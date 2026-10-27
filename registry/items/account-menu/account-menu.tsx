"use client";

import * as React from "react";
import { DropdownMenu as MenuPrimitive } from "radix-ui";
import {
  AnimatePresence,
  motion,
  useReducedMotionConfig,
  type Transition,
  type Variants,
} from "motion/react";
import { ChevronsUpDown, LogOut } from "lucide-react";

import { cn } from "@/lib/utils";

/* ─── Glyph gestures ──────────────────────────────────────────────────────
 * Every icon in the rail and its menu moves when its row is hovered or
 * highlighted. The gestures stay small (under ~10% scale, a few pixels, a few
 * degrees) so a column of them reads as one system rather than a toybox, and
 * each points at what its row does: the cog turns, the door's arrow leaves,
 * the person nods. Exported so a sidebar can drive its own rows the same way.
 */

export type IconGesture =
  | "none"
  /**
   * The icon animates itself: it is handed `animate` while active and left
   * still otherwise. For animated icon sets such as Animate UI's.
   */
  | "own"
  /** Small bounce down and up. People, profiles. */
  | "bob"
  /** Half a turn. Settings, cogs. */
  | "spin"
  /** A speech-bubble wobble. Help, messages, inboxes. */
  | "wiggle"
  /** A gentle sway either side. Accessibility, compass. */
  | "sway"
  /** Slides two pixels right. Log out, "open", forward. */
  | "nudge"
  /** Slides two pixels left. "Close", back. */
  | "nudge-back"
  /** Dips two pixels. Download, import. */
  | "drop"
  /** Grows and leans left. Shields, admin. */
  | "brace"
  /** Grows and leans right. Thumbs up, feedback. */
  | "tilt"
  /** A quick pop. Charts, analytics, anything else. */
  | "pop";

const GESTURE_SPRING: Transition = { type: "spring", stiffness: 420, damping: 17, mass: 0.6 };

export const ICON_GESTURES: Record<Exclude<IconGesture, "none" | "own">, Variants> = {
  bob: {
    rest: { y: 0 },
    active: { y: [0, 2, -2, 0], transition: { duration: 0.6, ease: "easeInOut" } },
  },
  // Half a turn lands a cog on itself, so the return can snap back unseen.
  spin: {
    rest: { rotate: 0, transition: { duration: 0 } },
    active: { rotate: [0, 90, 180], transition: { duration: 1.25, ease: "easeInOut" } },
  },
  wiggle: {
    rest: { rotate: 0 },
    active: {
      rotate: [0, 8, -8, 2, 0],
      transition: { duration: 0.8, ease: "easeInOut", times: [0, 0.4, 0.6, 0.8, 1] },
    },
  },
  sway: {
    rest: { rotate: 0 },
    active: { rotate: [0, 6, -6, 0], transition: { duration: 0.8, ease: "easeInOut" } },
  },
  nudge: {
    rest: { x: 0, transition: { duration: 0.3, ease: "easeInOut" } },
    active: { x: 2, transition: { duration: 0.3, ease: "easeInOut" } },
  },
  "nudge-back": {
    rest: { x: 0, transition: GESTURE_SPRING },
    active: { x: -2, transition: GESTURE_SPRING },
  },
  drop: {
    rest: { y: 0 },
    active: { y: [0, 2, 0], transition: { duration: 0.6, ease: "easeInOut" } },
  },
  brace: {
    rest: { scale: 1, rotate: 0, transition: GESTURE_SPRING },
    active: { scale: 1.1, rotate: -6, transition: GESTURE_SPRING },
  },
  tilt: {
    rest: { scale: 1, rotate: 0, transition: GESTURE_SPRING },
    active: { scale: 1.1, rotate: 6, transition: GESTURE_SPRING },
  },
  pop: {
    rest: { scale: 1 },
    active: { scale: [1, 1.12, 1], transition: { duration: 0.45, ease: "easeInOut" } },
  },
};

/**
 * Any icon component that takes a class and a stroke width: every lucide-react
 * icon fits. Icons used with the "own" gesture also take `animate`.
 */
export type GlyphComponent = React.ComponentType<{
  className?: string;
  strokeWidth?: number;
  "aria-hidden"?: boolean | "true" | "false";
  animate?: boolean;
}>;

/**
 * An icon that plays its gesture while `active`. Someone who asked the OS for
 * less motion gets a still glyph.
 */
export function GestureGlyph({
  icon: Icon,
  gesture = "none",
  active = false,
  className,
  strokeWidth,
}: {
  icon: GlyphComponent;
  gesture?: IconGesture;
  active?: boolean;
  className?: string;
  strokeWidth?: number;
}) {
  const reduceMotion = useReducedMotionConfig();
  const variants = gesture === "none" || gesture === "own" || reduceMotion ? undefined : ICON_GESTURES[gesture];
  // Only "own" icons are handed `animate`: a lucide icon would put it on its svg.
  const own = gesture === "own" ? { animate: active && !reduceMotion } : undefined;

  return (
    <motion.span
      aria-hidden="true"
      className="inline-flex shrink-0"
      variants={variants}
      initial={false}
      animate={active ? "active" : "rest"}
    >
      <Icon className={className} strokeWidth={strokeWidth} aria-hidden={true} {...own} />
    </motion.span>
  );
}

/* ─── Theme scope ─────────────────────────────────────────────────────────
 * Floating layers are portalled to <body>, out of any `[data-theme]` scope
 * (and any scoped `.dark`) the trigger sits in. Read the scope off the
 * trigger as the layer opens, and put it back on the layer.
 */

export type ThemeScope = { theme?: string; dark: boolean };

export function readThemeScope(from: Element | null | undefined): ThemeScope {
  const scope = from?.closest("[data-theme]");
  return {
    theme: scope?.getAttribute("data-theme") ?? undefined,
    dark: Boolean(scope?.classList.contains("dark")),
  };
}

/* ─── Avatar ────────────────────────────────────────────────────────────── */

/** First and last initials, then the first two letters, then the email's first letter. */
function initialsOf(name: string | null | undefined, email: string | null | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (email ?? "?").slice(0, 1).toUpperCase();
}

function AccountAvatar({ user }: { user: AccountUser }) {
  if (user.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- ships to any React app, not only Next
      <img
        src={user.avatarUrl}
        alt=""
        aria-hidden="true"
        className="size-9 shrink-0 rounded-lg object-cover"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-xs font-bold tracking-wide text-brand-hover"
    >
      {initialsOf(user.name, user.email)}
    </span>
  );
}

/* ─── Account menu ─────────────────────────────────────────────────────── */

export type AccountUser = {
  name?: string | null;
  email?: string | null;
  /** A short label under the name: the role, plan or team. Shown in capitals. */
  role?: string | null;
  /** A photo. Without one, the initials stand in. */
  avatarUrl?: string | null;
};

export type AccountMenuItem = {
  label: React.ReactNode;
  icon?: GlyphComponent;
  /** How the icon moves when the row is highlighted. Defaults to "pop". */
  gesture?: IconGesture;
  /** Renders the row as a link. */
  href?: string;
  /** Called when the row is chosen, by click or keyboard. */
  onSelect?: () => void;
  /** Red text and a red wash: for leaving or deleting. */
  destructive?: boolean;
  disabled?: boolean;
};

/** A row, or a hairline between groups. */
export type AccountMenuEntry = AccountMenuItem | "separator";

export interface AccountMenuProps {
  user: AccountUser;
  /** The rows between the identity header and "Log out". */
  items?: AccountMenuEntry[];
  /** Adds a red "Log out" row at the foot. Omit to leave it out. */
  onSignOut?: () => void | Promise<void>;
  /** Label for the sign-out row. Defaults to "Log out". */
  signOutLabel?: React.ReactNode;
  /**
   * For client-side routers: called instead of a full page load when a row
   * with an `href` is chosen. Without it, `href` rows are plain links.
   */
  onNavigate?: (href: string) => void;
  /**
   * Icon-only trigger at `md` and up, for a collapsed rail. Below `md` the
   * name always shows, because a collapsed rail is a desktop-only state.
   */
  collapsed?: boolean;
  /** Which side the menu opens on. Defaults to "top", for the foot of a rail. */
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  /** Classes for the trigger row. */
  className?: string;
  /** Classes for the floating menu. */
  contentClassName?: string;
}

const HIGHLIGHT_SPRING: Transition = { type: "spring", stiffness: 350, damping: 35 };

/**
 * The account block at the foot of an app rail. The row carries name and role,
 * the two things that decide what the rest of the rail shows, and holds the
 * email back for the menu, where checking *which* account you are signed into
 * is the reason you opened it.
 *
 * Radix owns open and close, focus and the keyboard. On top: the menu springs
 * up out of its trigger, a highlight slides between rows rather than jumping,
 * and each row's icon plays its gesture as the highlight lands on it.
 */
export function AccountMenu({
  user,
  items = [],
  onSignOut,
  signOutLabel = "Log out",
  onNavigate,
  collapsed = false,
  side = "top",
  align = "start",
  className,
  contentClassName,
}: AccountMenuProps) {
  const reduceMotion = useReducedMotionConfig();
  const [open, setOpen] = React.useState(false);
  const [highlighted, setHighlighted] = React.useState<string | null>(null);
  // The menu is portalled to <body>; carry the trigger's theme scope across.
  const [scope, setScope] = React.useState<ThemeScope>({ dark: false });
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const highlightId = React.useId();

  const displayName = user.name || user.email || "Account";

  function changeOpen(next: boolean) {
    if (next) {
      setScope(readThemeScope(triggerRef.current));
    } else {
      setHighlighted(null);
    }
    setOpen(next);
  }

  function clearOnLeave(event: React.PointerEvent<HTMLDivElement>) {
    const related = event.relatedTarget as Node | null;
    if (!related || !event.currentTarget.contains(related)) setHighlighted(null);
  }

  const rows: AccountMenuEntry[] = [...items];
  if (onSignOut) {
    if (rows.length > 0) rows.push("separator");
    rows.push({
      label: signOutLabel,
      icon: LogOut,
      gesture: "nudge",
      destructive: true,
      onSelect: () => void onSignOut(),
    });
  }

  return (
    <MenuPrimitive.Root open={open} onOpenChange={changeOpen}>
      <MenuPrimitive.Trigger asChild>
        <button
          ref={triggerRef}
          type="button"
          title={collapsed ? displayName : undefined}
          aria-label={collapsed ? `Account: ${displayName}` : undefined}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl p-2.5 text-left font-body transition-all hover:bg-ink/10 focus-visible:ring-2 focus-visible:ring-lead/30 focus-visible:outline-none data-[state=open]:bg-ink/12 md:pl-1.5",
            collapsed && "md:pr-1.5",
            className,
          )}
        >
          <AccountAvatar user={user} />
          {/* Hidden by class rather than unmounted: `collapsed` is a
              desktop-only state, and below `md` this block always shows. */}
          <span className={cn("min-w-0 flex-1", collapsed && "md:hidden")}>
            <span className="block truncate text-sm font-bold text-ink">{displayName}</span>
            {user.role && (
              <span className="block truncate text-xs font-bold tracking-wide text-faint uppercase">
                {user.role}
              </span>
            )}
          </span>
          <ChevronsUpDown
            className={cn("size-4 shrink-0 text-faint", collapsed && "md:hidden")}
            strokeWidth={1.75}
            aria-hidden="true"
          />
        </button>
      </MenuPrimitive.Trigger>

      <AnimatePresence>
        {open && (
          <MenuPrimitive.Portal forceMount>
            <MenuPrimitive.Content
              asChild
              forceMount
              side={side}
              align={align}
              sideOffset={8}
              // Never flush against a phone's edge.
              collisionPadding={12}
            >
              <motion.div
                data-slot="account-menu"
                data-theme={scope.theme}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
                transition={{ duration: reduceMotion ? 0.1 : 0.2 }}
                onPointerLeave={clearOnLeave}
                className={cn(
                  scope.dark && "dark",
                  "z-50 max-h-(--radix-dropdown-menu-content-available-height) w-60 min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border border-rule bg-popover/85 p-1 font-body text-popover-foreground shadow-md outline-none backdrop-blur-xl max-sm:max-w-[calc(100vw-1.5rem)]",
                  contentClassName,
                )}
              >
                <MenuPrimitive.Label className="flex items-center gap-3 px-2 py-2 text-sm font-normal">
                  <AccountAvatar user={user} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-ink">{displayName}</span>
                    {user.email && (
                      <span className="block truncate text-xs text-dim">{user.email}</span>
                    )}
                  </span>
                </MenuPrimitive.Label>

                {rows.length > 0 && <MenuSeparator />}

                {rows.map((row, index) => {
                  if (row === "separator") return <MenuSeparator key={`separator-${index}`} />;
                  const key = `row-${index}`;
                  return (
                    <MenuRow
                      key={key}
                      item={row}
                      active={highlighted === key}
                      highlightId={highlightId}
                      reduceMotion={Boolean(reduceMotion)}
                      onHighlight={() => setHighlighted(key)}
                      onNavigate={onNavigate}
                    />
                  );
                })}
              </motion.div>
            </MenuPrimitive.Content>
          </MenuPrimitive.Portal>
        )}
      </AnimatePresence>
    </MenuPrimitive.Root>
  );
}

function MenuSeparator() {
  return <MenuPrimitive.Separator className="-mx-1 my-1 h-px bg-border" />;
}

function MenuRow({
  item,
  active,
  highlightId,
  reduceMotion,
  onHighlight,
  onNavigate,
}: {
  item: AccountMenuItem;
  active: boolean;
  highlightId: string;
  reduceMotion: boolean;
  onHighlight: () => void;
  onNavigate?: (href: string) => void;
}) {
  const { label, icon, gesture = "pop", href, onSelect, destructive, disabled } = item;

  const body = (
    <>
      {/* One highlight per menu, handed from row to row by its layout id, so
          it slides to the row under the pointer instead of blinking there. */}
      {active && (
        <motion.span
          aria-hidden="true"
          layoutId={highlightId}
          transition={reduceMotion ? { duration: 0 } : HIGHLIGHT_SPRING}
          className={cn(
            "absolute inset-0 rounded-sm",
            destructive ? "bg-destructive/10" : "bg-accent",
          )}
        />
      )}
      <span className="relative flex min-w-0 flex-1 items-center gap-2">
        {icon && <GestureGlyph icon={icon} gesture={gesture} active={active} />}
        <span className="min-w-0 truncate">{label}</span>
      </span>
    </>
  );

  const className = cn(
    "relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none pointer-coarse:min-h-11",
    "focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
    destructive &&
      "text-destructive focus:text-destructive [&_svg:not([class*='text-'])]:text-destructive",
  );

  // A modified click (new tab, new window) is the browser's job, not the router's.
  const modifiedClick = React.useRef(false);
  const select = () => {
    onSelect?.();
    if (href && onNavigate && !modifiedClick.current) onNavigate(href);
    modifiedClick.current = false;
  };

  if (href) {
    return (
      <MenuPrimitive.Item
        asChild
        disabled={disabled}
        onSelect={select}
        onFocus={onHighlight}
        className={className}
      >
        <a
          href={href}
          onClick={(event) => {
            const modified = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
            modifiedClick.current = modified;
            if (onNavigate && !modified) event.preventDefault();
          }}
        >
          {body}
        </a>
      </MenuPrimitive.Item>
    );
  }

  return (
    <MenuPrimitive.Item
      disabled={disabled}
      onSelect={select}
      onFocus={onHighlight}
      className={className}
    >
      {body}
    </MenuPrimitive.Item>
  );
}
