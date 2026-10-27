"use client";

import * as React from "react";
import { Tooltip as TooltipPrimitive } from "radix-ui";
import { AnimatePresence, motion, useReducedMotionConfig } from "motion/react";
import { Menu, Moon, PanelLeftClose, PanelLeftOpen, Sun, X } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  AccountMenu,
  GestureGlyph,
  type AccountMenuProps,
  type GlyphComponent,
  readThemeScope,
  type IconGesture,
  type ThemeScope,
} from "../account-menu/account-menu";

/* ─── Types ────────────────────────────────────────────────────────────── */

export type SidebarNavItem = {
  href: string;
  label: string;
  /** Any lucide-react icon, or a component with the same props. */
  icon: GlyphComponent;
  /** How the icon moves when the row is hovered. Defaults to "pop". */
  gesture?: IconGesture;
  /**
   * Outstanding-work count, as a pill beside the label (a dot on the icon when
   * collapsed). Zero or less shows nothing: an empty pill is noise.
   */
  count?: number;
  /** Read aloud with the count. Defaults to "<n> outstanding". */
  countLabel?: string;
  /** Selects the row. Without it, the row is selected when `currentPath` is its href or one of `matches`. */
  active?: boolean;
  /** Other paths that select this row: a grouped entry's sibling tabs. */
  matches?: readonly string[];
};

export type SidebarSection = {
  /** A small capitals heading. Hidden while collapsed. */
  label?: string;
  items: SidebarNavItem[];
};

/** What a nav row hands its link: spread it onto `<a>` or a router's link. */
export type SidebarLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  ref?: React.Ref<HTMLAnchorElement>;
};

/** The sidebar's state, for slots that need to fit themselves to it. */
export type SidebarSlotState = { collapsed: boolean; mobileOpen: boolean };

type Slot = React.ReactNode | ((state: SidebarSlotState) => React.ReactNode);

export interface AppSidebarProps {
  sections: SidebarSection[];
  /** The path on screen, for working out which row is selected. Ignored by rows that set `active`. */
  currentPath?: string;
  /** The 32px mark at the top. When collapsed it doubles as the expand button. */
  logo?: React.ReactNode;
  /** The product name beside the logo. Hidden while collapsed. */
  title?: React.ReactNode;
  /** The account block at the foot. Omit for no account menu. */
  account?: Omit<AccountMenuProps, "collapsed">;
  /** Rows above the account menu: a theme switch, a notification bell. */
  footer?: Slot;
  /** Between the nav and the footer: an onboarding checklist, a promo card. */
  children?: Slot;
  /** Icon-only rail, at `md` and up. Controlled when set. */
  collapsed?: boolean;
  /** Starting state when uncontrolled. */
  defaultCollapsed?: boolean;
  /** Called with the new state; persist it here (localStorage, a cookie). */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Below `md` the rail is a drawer. Pair with `useSidebarDrawer`. */
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  /** Called when a nav row is followed. The drawer closes on its own. */
  onNavigate?: (item: SidebarNavItem) => void;
  /**
   * Renders each nav link. Defaults to `<a>`. Pass a router's link to keep
   * navigation client-side: `renderLink={(props) => <Link {...props} />}`.
   */
  renderLink?: (props: SidebarLinkProps) => React.ReactNode;
  /** The drawer's element id; `useSidebarDrawer().drawerId` when paired with it. */
  id?: string;
  /**
   * The brand-green wash the frosted rail blurs. "fixed" (default) pins it to
   * the viewport's left edge, as in an app shell; "absolute" pins it to the
   * nearest positioned ancestor, for a sidebar inside a frame; false for none.
   * Either way it sits at z -10, so the container needs `isolate` (or another
   * stacking context) for the page's content to paint above it.
   */
  wash?: "fixed" | "absolute" | false;
  className?: string;
}

/**
 * What the sidebar's frosted glass actually blurs: brand green, pooled at the
 * top-left where the navigation sits and lifted again along the bottom under
 * the account block, so the rail is brightest exactly where it is busiest.
 *
 * The lower layer is linear, not a second ellipse: an ellipse's edge stays
 * legible through a 40px blur at this scale. The mask retires the wash's own
 * right edge, so no boundary shows however wide the rail is collapsed to.
 */
export function SidebarWash({ position = "fixed", className }: { position?: "fixed" | "absolute"; className?: string }) {
  // A mask, not paint: alpha stops that name no colour.
  const fadeOutRight = "linear-gradient(to right, black 55%, transparent 100%)";
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none inset-y-0 left-0 -z-10 w-[420px] max-w-full", position, className)}
      style={{
        background: [
          "radial-gradient(85% 55% at 0% 0%, color-mix(in srgb, var(--brand) 45%, transparent), transparent 72%)",
          "linear-gradient(to bottom, transparent 22%, color-mix(in srgb, var(--brand) 26%, transparent) 100%)",
        ].join(", "),
        WebkitMaskImage: fadeOutRight,
        maskImage: fadeOutRight,
      }}
    />
  );
}

/* ─── Sidebar ──────────────────────────────────────────────────────────── */

const DEFAULT_LINK = (props: SidebarLinkProps) => <a {...props} />;

/**
 * A frosted app rail: logo and name, sections of nav rows with counts, an
 * optional slot, a footer, and the account menu. It collapses to icons at
 * `md` and up (tooltips name each row), and below `md` it leaves the flow and
 * slides in as a drawer.
 *
 * The consumer decides what each person sees: pass only the rows they can
 * open. Hovering anywhere on a row plays its icon's gesture, so the whole
 * target responds, not just the 20px glyph.
 */
export function AppSidebar({
  sections,
  currentPath,
  logo,
  title,
  account,
  footer,
  children,
  collapsed: collapsedProp,
  defaultCollapsed = false,
  onCollapsedChange,
  mobileOpen = false,
  onMobileClose,
  onNavigate,
  renderLink = DEFAULT_LINK,
  id,
  wash = "fixed",
  className,
}: AppSidebarProps) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultCollapsed);
  const collapsed = collapsedProp ?? uncontrolled;
  const [logoHover, setLogoHover] = React.useState(false);
  const [closeHover, setCloseHover] = React.useState(false);
  const asideRef = React.useRef<HTMLElement>(null);

  function setCollapsed(next: boolean) {
    if (collapsedProp === undefined) setUncontrolled(next);
    onCollapsedChange?.(next);
  }

  const state: SidebarSlotState = { collapsed, mobileOpen };
  const fill = (slot: Slot) => (typeof slot === "function" ? slot(state) : slot);
  const slot = fill(children);
  const footerSlot = fill(footer);

  return (
    <>
    {wash ? <SidebarWash position={wash} /> : null}
    <aside
      ref={asideRef}
      id={id}
      className={cn(
        // Below `md`: a drawer. Closed, it is `invisible` as well as
        // off-screen, so its links leave the tab order and the reading order;
        // `visibility` flips at the end of the slide, so the slide still shows.
        "fixed inset-y-0 left-0 z-50 transition-[translate,visibility] duration-200",
        mobileOpen ? "visible translate-x-0" : "invisible -translate-x-full",
        "md:visible md:sticky md:top-0 md:translate-x-0 md:transition-[width]",
        "flex h-dvh w-64 shrink-0 flex-col bg-card/55 font-body backdrop-blur-2xl backdrop-saturate-150",
        "pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] md:pt-0 md:pb-0",
        // The right edge: a hairline that fades in from the card at each end.
        "after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-linear-to-b after:from-card/90 after:via-ink/12 after:to-card/50",
        collapsed ? "md:w-16" : "md:w-64",
        className,
      )}
    >
      {/*
       * One logo button, the same size and node whether collapsed or not, so
       * it reads as one mark rather than two crossfading. The row is pinned
       * to its 36px, so the nav below does not shift when the collapse button
       * on its right comes and goes.
       */}
      <div className="flex h-[68px] shrink-0 items-center justify-between gap-2.5 px-3.5 py-4">
        <button
          type="button"
          onClick={() => collapsed && setCollapsed(false)}
          onPointerEnter={() => setLogoHover(true)}
          onPointerLeave={() => setLogoHover(false)}
          aria-label={collapsed ? "Expand sidebar" : undefined}
          aria-hidden={collapsed ? undefined : true}
          tabIndex={collapsed ? 0 : -1}
          className={cn(
            "group relative flex size-9 shrink-0 items-center justify-center rounded-xl transition-all focus-visible:ring-2 focus-visible:ring-lead/30 focus-visible:outline-none",
            collapsed ? "hover:bg-ink/10" : "cursor-default",
          )}
        >
          <span
            className={cn(
              "flex size-8 items-center justify-center transition-opacity duration-200 [&>img]:size-8 [&>img]:object-contain [&>svg]:size-8",
              collapsed && "md:group-hover:opacity-0",
            )}
          >
            {logo}
          </span>
          {collapsed && (
            <span className="absolute inset-0 hidden items-center justify-center text-ink opacity-0 transition-opacity duration-200 group-hover:opacity-100 md:flex">
              <GestureGlyph
                icon={PanelLeftOpen}
                gesture="nudge"
                active={logoHover}
                className="size-5"
                strokeWidth={1.8}
              />
            </span>
          )}
        </button>

        <span
          className={cn(
            "min-w-0 flex-1 truncate font-heading text-base font-extrabold tracking-tight text-ink transition-opacity duration-150",
            collapsed && "md:hidden",
          )}
        >
          {title}
        </span>

        {!collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            onPointerEnter={() => setCloseHover(true)}
            onPointerLeave={() => setCloseHover(false)}
            aria-label="Collapse sidebar"
            className="ml-auto hidden shrink-0 rounded-xl p-1.5 text-dim transition-all hover:bg-ink/10 hover:text-ink focus-visible:ring-2 focus-visible:ring-lead/30 focus-visible:outline-none md:inline-flex"
          >
            <GestureGlyph
              icon={PanelLeftClose}
              gesture="nudge-back"
              active={closeHover}
              className="size-5"
              strokeWidth={1.8}
            />
          </button>
        )}

        <button
          type="button"
          onClick={onMobileClose}
          aria-label="Close navigation"
          className="relative ml-auto shrink-0 rounded-xl p-1.5 text-dim transition-all after:absolute after:top-1/2 after:left-1/2 after:size-11 after:-translate-x-1/2 after:-translate-y-1/2 after:content-[''] hover:bg-ink/10 hover:text-ink focus-visible:ring-2 focus-visible:ring-lead/30 focus-visible:outline-none md:hidden"
        >
          <X className="size-5" strokeWidth={1.8} aria-hidden="true" />
        </button>
      </div>

      <TooltipPrimitive.Provider delayDuration={400}>
        <nav
          aria-label="Primary"
          className="flex-1 space-y-6 overflow-x-hidden overflow-y-auto px-2 py-2"
        >
          {sections.map((section, index) => (
            <div key={section.label ?? index}>
              {section.label && (
                <p
                  className={cn(
                    "px-3 pb-1 text-xs font-bold tracking-wide text-faint uppercase",
                    collapsed && "md:hidden",
                  )}
                >
                  {section.label}
                </p>
              )}
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <NavRow
                      item={item}
                      active={
                        item.active ??
                        (currentPath !== undefined &&
                          (currentPath === item.href ||
                            Boolean(item.matches?.includes(currentPath))))
                      }
                      collapsed={collapsed}
                      renderLink={renderLink}
                      themeFrom={asideRef}
                      onFollow={() => {
                        onNavigate?.(item);
                        onMobileClose?.();
                      }}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </TooltipPrimitive.Provider>

      {slot != null && slot !== false && <div className="px-2 pb-2">{slot}</div>}

      {(footerSlot != null && footerSlot !== false) || account ? (
        <div className="space-y-1 border-t border-card/70 p-2">
          {footerSlot}
          {account && <AccountMenu {...account} collapsed={collapsed} />}
        </div>
      ) : null}
    </aside>
    </>
  );
}

/* ─── A nav row ────────────────────────────────────────────────────────── */

function NavRow({
  item,
  active,
  collapsed,
  renderLink,
  themeFrom,
  onFollow,
}: {
  item: SidebarNavItem;
  active: boolean;
  collapsed: boolean;
  renderLink: (props: SidebarLinkProps) => React.ReactNode;
  themeFrom: React.RefObject<HTMLElement | null>;
  onFollow: () => void;
}) {
  const reduceMotion = useReducedMotionConfig();
  const [hovered, setHovered] = React.useState(false);
  const [tooltipOpen, setTooltipOpen] = React.useState(false);
  // The tooltip is portalled to <body>; carry the trigger's theme scope.
  const [scope, setScope] = React.useState<ThemeScope>({ dark: false });

  const count = item.count ?? 0;
  const showCount = count > 0;
  const countText = count > 99 ? "99+" : String(count);
  const countLabel = item.countLabel ?? `${count} outstanding`;

  const link = renderLink({
    href: item.href,
    "aria-current": active ? "page" : undefined,
    onPointerEnter: () => setHovered(true),
    onPointerLeave: () => setHovered(false),
    onClick: onFollow,
    className: cn(
      "relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-ink transition-all hover:bg-ink/10 focus-visible:ring-2 focus-visible:ring-lead/30 focus-visible:outline-none",
      active ? "bg-ink/12 font-bold text-ink" : "font-semibold text-ink/85 hover:text-ink",
    ),
    children: (
      <>
        <GestureGlyph
          icon={item.icon}
          gesture={item.gesture ?? "pop"}
          active={hovered}
          className="size-5"
          strokeWidth={1.75}
        />
        <span className={cn("min-w-0 flex-1 truncate", collapsed && "md:hidden")}>
          {item.label}
        </span>
        {showCount && (
          <span
            aria-label={countLabel}
            className={cn(
              "shrink-0 rounded-full bg-lead px-2 py-0.5 text-[12px] font-bold text-on-solid tabular-nums",
              collapsed && "md:hidden",
            )}
          >
            {countText}
          </span>
        )}
        {showCount && collapsed && (
          <span
            aria-label={countLabel}
            className="absolute top-1 right-1 hidden h-4 min-w-4 items-center justify-center rounded-full bg-lead px-1 text-[10px] font-bold text-on-solid tabular-nums md:flex"
          >
            {countText}
          </span>
        )}
      </>
    ),
  });

  if (!collapsed) return link;

  return (
    <TooltipPrimitive.Root
      open={tooltipOpen}
      onOpenChange={(next) => {
        if (next) {
          setScope(readThemeScope(themeFrom.current));
        }
        setTooltipOpen(next);
      }}
    >
      <TooltipPrimitive.Trigger asChild>{link}</TooltipPrimitive.Trigger>
      <AnimatePresence>
        {tooltipOpen && (
          <TooltipPrimitive.Portal forceMount>
            <TooltipPrimitive.Content asChild forceMount side="right" sideOffset={10} collisionPadding={12}>
              <motion.div
                data-theme={scope.theme}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.5 }}
                transition={
                  reduceMotion ? { duration: 0.1 } : { type: "spring", stiffness: 300, damping: 25 }
                }
                className={cn(
                  scope.dark && "dark",
                  "z-50 origin-(--radix-tooltip-content-transform-origin) rounded-xl bg-ink px-3.5 py-2 font-body text-sm font-semibold text-on-solid shadow-lg",
                )}
              >
                {item.label}
              </motion.div>
            </TooltipPrimitive.Content>
          </TooltipPrimitive.Portal>
        )}
      </AnimatePresence>
    </TooltipPrimitive.Root>
  );
}

/* ─── Theme switch ─────────────────────────────────────────────────────── */

const TAP_TARGET =
  "pointer-coarse:relative pointer-coarse:after:absolute pointer-coarse:after:top-1/2 pointer-coarse:after:left-1/2 pointer-coarse:after:size-[max(100%,44px)] pointer-coarse:after:-translate-x-1/2 pointer-coarse:after:-translate-y-1/2 pointer-coarse:after:content-['']";

/**
 * Light or dark, for the sidebar's footer: a bare word and a two-button pill,
 * or a single sun/moon button when the rail is collapsed. It shows and sets a
 * value; the consumer owns where the theme lives (next-themes, a cookie).
 */
export function SidebarThemeSwitch({
  dark,
  onDarkChange,
  collapsed = false,
  showLabel = true,
  className,
}: {
  dark: boolean;
  onDarkChange: (dark: boolean) => void;
  /** Pass the sidebar's `collapsed` (from a slot function) to shrink to one button. */
  collapsed?: boolean;
  /** The "Light" / "Dark" word beside the pill. */
  showLabel?: boolean;
  className?: string;
}) {
  const label = dark ? "Switch to light" : "Switch to dark";

  return (
    <>
      {collapsed && (
        <button
          type="button"
          onClick={() => onDarkChange(!dark)}
          title={label}
          aria-label={label}
          className={cn(
            "mx-auto hidden size-9 items-center justify-center rounded-xl text-dim transition-all hover:bg-ink/10 hover:text-ink focus-visible:ring-2 focus-visible:ring-lead/30 focus-visible:outline-none md:flex",
            className,
          )}
        >
          {dark ? (
            <Sun className="size-4" strokeWidth={1.8} aria-hidden="true" />
          ) : (
            <Moon className="size-4" strokeWidth={1.8} aria-hidden="true" />
          )}
        </button>
      )}
      {/* Collapsed is a desktop-only state: below `md` the full switch shows. */}
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl",
          showLabel && "px-2.5 py-1.5",
          collapsed && "md:hidden",
          className,
        )}
      >
        {showLabel && (
          <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-dim">
            {dark ? "Dark" : "Light"}
          </span>
        )}
        <div
          role="group"
          aria-label="Theme"
          className="flex shrink-0 items-center gap-0.5 rounded-full border border-rule bg-card/60 p-0.5"
        >
          <button
            type="button"
            onClick={() => onDarkChange(false)}
            aria-pressed={!dark}
            title="Light"
            className={cn(
              "flex size-6 items-center justify-center rounded-full transition-colors",
              TAP_TARGET,
              dark ? "text-faint hover:text-ink" : "bg-ink text-on-solid",
            )}
          >
            <Sun className="size-3.5" strokeWidth={2} aria-hidden="true" />
            <span className="sr-only">Light</span>
          </button>
          <button
            type="button"
            onClick={() => onDarkChange(true)}
            aria-pressed={dark}
            title="Dark"
            className={cn(
              "flex size-6 items-center justify-center rounded-full transition-colors",
              TAP_TARGET,
              dark ? "bg-ink text-on-solid" : "text-faint hover:text-ink",
            )}
          >
            <Moon className="size-3.5" strokeWidth={2} aria-hidden="true" />
            <span className="sr-only">Dark</span>
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── The phone half ───────────────────────────────────────────────────── */

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const SCRIM_ATTRIBUTE = "data-sidebar-scrim";

/**
 * Open and close for the drawer, with the modal manners a keyboard needs:
 * focus moves to the drawer's first control, everything else on the page goes
 * `inert` so Tab cannot wander under the scrim, Escape closes, the page stops
 * scrolling behind it, and closing hands focus back to the burger. Widening
 * past `md` closes it, so nothing is left inert behind a drawer nobody sees.
 *
 * Close it on navigation too: call `setOpen(false)` when your route changes
 * (the sidebar already closes it when one of its own rows is followed).
 */
export function useSidebarDrawer() {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const drawerId = React.useId();

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const desktop = window.matchMedia("(min-width: 768px)");
    const onWiden = () => {
      if (desktop.matches) setOpen(false);
    };
    desktop.addEventListener("change", onWiden);

    const trigger = triggerRef.current;
    const drawer = document.getElementById(drawerId);
    const release = drawer ? inertOutside(drawer) : () => {};
    drawer?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onWiden);
      document.body.style.overflow = previousOverflow;
      release();
      const active = document.activeElement;
      const focusWasInDrawer =
        active === document.body || (drawer !== null && drawer.contains(active));
      if (focusWasInDrawer) trigger?.focus();
    };
  }, [open, drawerId]);

  return { open, setOpen, triggerRef, drawerId };
}

/**
 * Marks everything except `drawer` (and the scrim) inert, walking from the
 * drawer up to `<body>` so skip links, notices and portals beside the shell
 * are caught too, and keeps marking anything added while it is open. Returns a
 * function that undoes exactly what it did.
 */
function inertOutside(drawer: HTMLElement): () => void {
  const changed: HTMLElement[] = [];
  const path = new Set<Element>();
  const levels: HTMLElement[] = [];
  for (
    let node: HTMLElement = drawer;
    node.parentElement && node !== document.body;
    node = node.parentElement
  ) {
    path.add(node);
    levels.push(node.parentElement);
  }

  const mark = (element: Element) => {
    if (path.has(element) || !(element instanceof HTMLElement)) return;
    if (element.hasAttribute(SCRIM_ATTRIBUTE) || element.hasAttribute("inert")) return;
    element.setAttribute("inert", "");
    changed.push(element);
  };

  for (const level of levels) for (const child of Array.from(level.children)) mark(child);

  const observer = new MutationObserver((records) => {
    for (const record of records)
      for (const node of Array.from(record.addedNodes)) {
        if (node instanceof Element) mark(node);
      }
  });
  for (const level of levels) observer.observe(level, { childList: true });

  return () => {
    observer.disconnect();
    for (const element of changed) element.removeAttribute("inert");
  };
}

/** The dimmed page behind the open drawer. Tapping it closes the drawer. Phones only. */
export function SidebarScrim({
  open,
  onClose,
  className,
}: {
  open: boolean;
  onClose: () => void;
  className?: string;
}) {
  if (!open) return null;
  return (
    <div
      aria-hidden="true"
      {...{ [SCRIM_ATTRIBUTE]: "" }}
      onClick={onClose}
      // Between the page's own top layer and the drawer's z-50.
      className={cn("fixed inset-0 z-[45] bg-ground/70 backdrop-blur-[2px] md:hidden", className)}
    />
  );
}

/**
 * The bar that stands in for the rail on a phone: a burger, and room for a
 * title. It clears the notch in portrait and the rounded corners in landscape.
 */
export function SidebarMobileBar({
  open,
  onOpen,
  triggerRef,
  drawerId,
  label = "Open navigation",
  children,
  className,
}: {
  open: boolean;
  onOpen: () => void;
  /** `useSidebarDrawer().triggerRef`, so closing the drawer hands focus back here. */
  triggerRef?: React.Ref<HTMLButtonElement>;
  /** `useSidebarDrawer().drawerId`: the element the burger controls. */
  drawerId?: string;
  label?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "sticky top-0 z-[44] flex shrink-0 items-center gap-2 border-b border-rule bg-card/80 pt-[env(safe-area-inset-top)] pr-[max(1rem,env(safe-area-inset-right))] pl-[max(0.5rem,env(safe-area-inset-left))] font-body backdrop-blur-xl md:hidden",
        className,
      )}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={onOpen}
        aria-label={label}
        aria-expanded={open}
        aria-controls={drawerId}
        className="flex size-11 shrink-0 items-center justify-center rounded-xl text-dim transition-all hover:bg-paper hover:text-ink focus-visible:ring-2 focus-visible:ring-lead/30 focus-visible:outline-none"
      >
        <Menu className="size-5" strokeWidth={1.8} aria-hidden="true" />
      </button>
      {children}
    </div>
  );
}
