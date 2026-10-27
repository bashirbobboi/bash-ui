"use client";

// Portfolio's Animate UI community radial navigation by arhamkhnz.
// See radial-nav.LICENSE.txt for the original distribution terms.
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Menu, MousePointer2, type LucideIcon } from "lucide-react";
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotionConfig, type Variants } from "motion/react";
import { cn } from "@/lib/utils";

export type RadialNavItem = { id: number; label: string; icon: LucideIcon; angle?: number };
export type MenuButtonConfig = { iconSize?: number; buttonSize?: number; buttonPadding?: number };
export type RadialNavProps = {
  items: RadialNavItem[];
  size?: number;
  buttonSize?: number;
  menuButtonConfig?: MenuButtonConfig;
  label?: string;
  activeId?: number | null;
  defaultActiveId?: number;
  onActiveChange?: (id: number) => void;
  collapsible?: boolean;
  className?: string;
};

const LABEL_VARIANTS: Variants = {
  rest: { opacity: 0, x: 4 },
  hover: { opacity: 1, x: 0, visibility: "visible", width: "auto" },
  tap: { opacity: 1, x: 0, visibility: "visible", width: "auto" },
};

export function RadialNav({ items, size = 150, buttonSize = 40, menuButtonConfig, label = "Radial navigation", activeId: controlledId, defaultActiveId, onActiveChange, collapsible = false, className }: RadialNavProps) {
  const reduced = useReducedMotionConfig();
  const [internalId, setInternalId] = useState<number | null>(defaultActiveId ?? null);
  const [expanded, setExpanded] = useState(false);
  const [isArrowMoving, setIsArrowMoving] = useState(false);
  const activeId = controlledId === undefined ? internalId : controlledId;
  const activeIndex = items.findIndex((item) => item.id === activeId);
  const activeItem = items[activeIndex];
  const activeAngle = activeIndex < 0 ? 0 : (activeItem.angle ?? activeIndex * 360 / items.length);
  const rotation = useMotionValue(activeAngle + 45);
  const mounted = useRef(false);
  const navRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const resolved = { iconSize: 20, buttonSize, buttonPadding: 8, ...menuButtonConfig };
  const iconOffset = (resolved.buttonSize - resolved.iconSize) / 2 - resolved.buttonPadding - 1;
  const ActiveIcon = activeItem?.icon ?? Menu;
  const showRing = !collapsible || expanded;

  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    const current = rotation.get();
    const delta = ((activeAngle + 45 - current) % 360 + 540) % 360 - 180;
    let emphasisTimer: ReturnType<typeof setTimeout> | undefined;
    const animation = animate(rotation, current + delta, {
      ...(reduced ? { duration: 0 } : { type: "spring", stiffness: 220, damping: 26 } as const),
      onPlay: () => {
        if (!reduced) {
          setIsArrowMoving(true);
          emphasisTimer = setTimeout(() => setIsArrowMoving(false), 350);
        }
      },
    });
    return () => { animation.stop(); clearTimeout(emphasisTimer); };
  }, [activeAngle, rotation, reduced]);

  useEffect(() => {
    if (!collapsible || !expanded) return;
    const dismiss = (event: PointerEvent) => {
      if (!navRef.current?.contains(event.target as Node)) setExpanded(false);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [collapsible, expanded]);

  function select(id: number) {
    if (controlledId === undefined) setInternalId(id);
    onActiveChange?.(id);
    if (collapsible) setExpanded(false);
  }

  function handleKeys(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape" && collapsible) {
      setExpanded(false);
      requestAnimationFrame(() => toggleRef.current?.focus());
      return;
    }
    if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const buttons = [...(navRef.current?.querySelectorAll<HTMLButtonElement>("[data-radial-item]") ?? [])];
    if (!buttons.length) return;
    event.preventDefault();
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const target = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 :
      (index + (event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1) + buttons.length) % buttons.length;
    buttons[target]?.focus();
  }

  return (
    <nav ref={navRef} aria-label={label} onKeyDown={handleKeys} className={cn("inline-flex max-w-full items-center justify-center p-12 font-body", className)}>
      <AnimatePresence mode="wait" initial={false}>
        {showRing ? (
          <motion.div key="expanded" initial={collapsible && !reduced ? { scale: 0.5, opacity: 0 } : false} animate={{ scale: 1, opacity: 1 }} exit={reduced ? { opacity: 0 } : { scale: 0.5, opacity: 0 }} transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 280, damping: 26 }} className="relative flex shrink-0 items-center justify-center rounded-full" style={{ width: size, height: size, originX: 0, originY: 0 }}>
            <motion.div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 rounded-full border", activeId !== null ? "border-ink" : "border-dim")} initial={{ opacity: 0.4 }} animate={{ opacity: isArrowMoving ? 1 : 0.4 }} transition={{ duration: reduced ? 0 : 0.2 }} />
            <motion.div aria-hidden="true" initial={false} style={{ rotate: rotation, originX: 0.5, originY: 0.5 }} animate={{ opacity: isArrowMoving ? 1 : 0.4 }} transition={{ duration: reduced ? 0 : 0.2 }} className={cn("pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2", activeId !== null ? "text-ink" : "text-dim")}>
              <MousePointer2 className="size-5" />
            </motion.div>
            {items.map((item, index) => {
              const angle = item.angle ?? index * 360 / items.length;
              const radians = (angle - 90) * Math.PI / 180;
              const radius = size / 2 - 0.5;
              const selected = activeId === item.id;
              const Icon = item.icon;
              return (
                <div key={item.id} className="group absolute" style={{ left: `calc(50% + ${Math.cos(radians) * radius}px)`, top: `calc(50% + ${Math.sin(radians) * radius}px)`, transform: "translate(-50%, -50%)" }}>
                  <motion.button type="button" data-radial-item aria-label={item.label} aria-current={selected ? "location" : undefined} aria-pressed={selected}
                    onClick={() => select(item.id)}
                    initial={false} animate={selected ? "hover" : "rest"}
                    variants={{ rest: { maxWidth: resolved.buttonSize }, hover: { maxWidth: 140, transition: reduced ? { duration: 0 } : { type: "spring", stiffness: 200, damping: 35, delay: 0.05 } }, tap: { scale: reduced ? 1 : 0.95 } }}
                    transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 200, damping: 25 }}
                    style={{ height: resolved.buttonSize, minWidth: resolved.buttonSize, padding: resolved.buttonPadding }}
                    className={cn("relative flex space-x-1 items-center overflow-hidden whitespace-nowrap rounded-full border bg-card font-medium focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring", selected ? "border-ink text-ink" : "border-faint text-faint")}>
                    <Icon aria-hidden="true" className="shrink-0" style={{ height: resolved.iconSize, width: resolved.iconSize, transform: `translateX(${iconOffset}px)` }} />
                    <motion.span variants={reduced ? { rest: { opacity: 0, width: 0 }, hover: { opacity: 1, x: 0, visibility: "visible", width: "auto" } } : LABEL_VARIANTS} transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 200, damping: 25 }} className="invisible w-0 text-sm">{item.label}</motion.span>
                  </motion.button>
                </div>
              );
            })}
          </motion.div>
        ) : (
          <motion.button key="collapsed" ref={toggleRef} type="button" aria-expanded={false} aria-label="Open navigation" onClick={() => setExpanded(true)} initial={reduced ? false : { scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={reduced ? { opacity: 0 } : { scale: 0.5, opacity: 0 }} transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 24 }} className="inline-flex size-12 items-center justify-center rounded-full border border-ink bg-card text-ink shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
            <ActiveIcon className="size-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </nav>
  );
}
