"use client";

import { Children, cloneElement, Fragment, isValidElement, Suspense, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import { useReducedMotionConfig } from "motion/react";
import { balanceTiles, tileSpans, type TilePlacement, type TileSize } from "@/lib/tile-layout";
import { cn } from "@/lib/utils";
import "./tiles.css";

type TileStyle = CSSProperties & Record<`--tile-${string}`, string>;

/**
 * Content-sized stacks, balanced independently for each gallery and viewport.
 *
 * `reveal` is the index of the tile a link pointed at. Once the grid has laid
 * itself out, that tile is scrolled into view (if it is not already) and
 * marked for a moment. Next keeps visited pages alive and re-runs their
 * effects when one is shown again, so returning to a page lands again too.
 */
export function TileGrid({
  children,
  className,
  reveal,
}: {
  children: ReactNode;
  className?: string;
  reveal?: number;
}) {
  const reduce = useReducedMotionConfig();
  const gridRef = useRef<HTMLDivElement>(null);
  const [sizes, setSizes] = useState<TileSize[]>([]);
  const [plan, setPlan] = useState<{ key: string; placements: TilePlacement[] } | null>(null);
  const measuredWidth = useRef(0);
  const tiles = Children.toArray(children).filter(isValidElement<{ className?: string; style?: CSSProperties }>);
  const fullWidth = tiles.map((tile) => tile.props.className?.split(/\s+/).includes("md:col-span-2") ?? false);
  const spans = tileSpans(fullWidth);
  const collectionKey = JSON.stringify(tiles.map((tile, index) => [tile.key, fullWidth[index]]));

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    let frame = 0;
    const measure = () => {
      if (!grid.clientWidth) return; // Tabs can mount before becoming visible.
      if (grid.clientWidth !== measuredWidth.current) {
        measuredWidth.current = grid.clientWidth;
        setPlan(null);
      }
      const next = Array.from(grid.children, (element, index) => {
        const tile = element as HTMLElement;
        const content = tile.querySelector<HTMLElement>("[data-tile-content]");
        const css = getComputedStyle(tile);
        // Interaction can open content beyond its surface; retain its rest size.
        const height = tile.dataset.surfaceLocked === "true" && sizes[index]
          ? sizes[index].height
          : Math.max(
            parseFloat(css.getPropertyValue("--tile-min-height")) || 144,
            Math.ceil(content?.getBoundingClientRect().height ?? tile.scrollHeight)
              + 2 * (parseFloat(css.getPropertyValue("--tile-padding")) || 40),
          );
        return { height, fullWidth: css.getPropertyValue("--tile-full").trim() === "1" };
      });
      setSizes((current) => current.length === next.length && next.every((size, index) =>
        size.height === current[index].height && size.fullWidth === current[index].fullWidth,
      ) ? current : next);
    };
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    });
    observer.observe(grid);
    for (const tile of grid.children) {
      const content = tile.querySelector("[data-tile-content]");
      if (content) observer.observe(content);
    }
    frame = requestAnimationFrame(measure);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [collectionKey, sizes]);

  const ready = sizes.length === tiles.length && sizes.every((size, index) => size.fullWidth === fullWidth[index]);
  const placements = ready ? balanceTiles(sizes, 12, plan?.key === collectionKey ? plan.placements : undefined) : [];

  useEffect(() => {
    if (!ready || reveal === undefined) return;
    const tile = gridRef.current?.children[reveal];
    if (!(tile instanceof HTMLElement)) return;
    // The pinned header covers the top of the viewport (`scroll-padding-top`).
    const header = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    const box = tile.getBoundingClientRect();
    if (box.top < header || box.bottom > window.innerHeight) {
      tile.scrollIntoView({
        behavior: reduce ? "auto" : "smooth",
        block: box.height > window.innerHeight - header ? "start" : "center",
      });
    }
    tile.setAttribute("data-revealed", "");
    return () => tile.removeAttribute("data-revealed");
  }, [ready, reveal, reduce]);

  function preservePlacement() {
    if (ready) setPlan((current) => current?.key === collectionKey ? current : { key: collectionKey, placements });
  }
  // Only create tracks at tile edges, including the empty tracks for gutters.
  const edges = [...new Set(placements.flatMap(({ top, height }) => [top, top + height]))].sort((a, b) => a - b);
  const rows = edges.slice(1).map((edge, index) => `${edge - edges[index]}px`).join(" ");

  return (
    <div
      ref={gridRef}
      onPointerDownCapture={preservePlacement}
      onFocusCapture={preservePlacement}
      className={cn("grid grid-cols-1 items-stretch gap-3 md:grid-cols-2 [&>*]:min-w-0", ready && "gallery-balanced", className)}
      style={ready ? { "--tile-rows": rows } as TileStyle : undefined}
    >
      {tiles.map((tile, index) => cloneElement(tile, {
        className: cn(tile.props.className, spans[index] === 2 && "md:col-span-2"),
        style: {
          ...tile.props.style,
          "--tile-full": fullWidth[index] ? "1" : "0",
          ...(placements[index] ? {
            "--tile-column": `${placements[index].column} / span ${placements[index].span}`,
            "--tile-row": `${edges.indexOf(placements[index].top) + 1} / ${edges.indexOf(placements[index].top + placements[index].height) + 1}`,
          } : {}),
        } as TileStyle,
      }))}
    </div>
  );
}

/**
 * A surface that holds its size while you use what is on it.
 *
 * At rest it sizes to its content like any box. The moment a pointer or the
 * keyboard reaches it, it locks its height and pins the content where it
 * stands, so a component that opens (a search panel, a menu, a longer state)
 * spills over whatever is below, the way a dropdown does, instead of
 * stretching the surface and shoving the rest of the page about. While in use
 * it rises above its neighbours so the spill draws on top.
 *
 * It is always its own stacking layer (`isolate`), so a component's own
 * z-index (the search bar uses z-50) stays inside it and the page scrolls
 * under the pinned header, never over it.
 *
 * `grow` keeps inline reveals in the page flow instead, letting the surface
 * and the surrounding gallery grow with their content.
 *
 * It unlocks when the window changes width (the rest size changes with it) or
 * when `resetKey` changes (the playground's settings changed what "at rest" is).
 */
export function SteadySurface({
  id,
  theme,
  resetKey,
  className,
  children,
  overlay,
  style,
  grow = false,
}: {
  id?: string;
  theme: string;
  resetKey?: string;
  className?: string;
  children: ReactNode;
  overlay?: ReactNode;
  style?: CSSProperties;
  grow?: boolean;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [locked, setLocked] = useState<{ height: number; top: number } | null>(null);
  const [lockedFor, setLockedFor] = useState(resetKey);

  // A new `resetKey` releases the lock (state adjusted during render, not in an effect).
  if (lockedFor !== resetKey) {
    setLockedFor(resetKey);
    setLocked(null);
  }

  useEffect(() => {
    let width = window.innerWidth;
    const onResize = () => {
      if (window.innerWidth === width) return; // a phone's toolbar hiding is not a new layout
      width = window.innerWidth;
      setLocked(null);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function lock() {
    if (grow || locked) return;
    const box = boxRef.current;
    const content = contentRef.current;
    if (!box || !content) return;
    setLocked({ height: box.offsetHeight, top: content.offsetTop });
  }

  return (
    <div
      id={id}
      ref={boxRef}
      onPointerEnter={lock}
      onFocusCapture={lock}
      data-surface-locked={!grow && locked ? "true" : undefined}
      style={{ ...style, ...(!grow && locked ? { height: "100%", minHeight: locked.height, paddingTop: locked.top, alignItems: "flex-start" } : {}) }}
      className={cn("relative isolate flex justify-center hover:z-20 focus-within:z-20", className)}
    >
      <div ref={contentRef} data-tile-content data-theme={theme} className="flex w-full justify-center">
        {/* Some previews show "the last 30 days" and so read today's date;
            Suspense lets them render per visit instead of once at build. */}
        <Suspense fallback={null}>{children}</Suspense>
      </div>
      {overlay}
    </div>
  );
}

/**
 * One component, once, on a plain surface. Nothing else in the tile: the
 * name and any action only surface on hover, in the corners.
 *
 * The tile paints the site's surface; the component inside renders in the
 * named design system's tokens (`data-theme`), without that system's page
 * colour behind it, so every tile sits on the same ground.
 */
export function Tile({
  theme,
  label,
  corner,
  replay,
  grow,
  children,
  className,
  style,
}: {
  theme: string;
  label?: string;
  corner?: ReactNode;
  /** The component animates once on mount; offer a button that mounts it again. */
  replay?: boolean;
  /** Let inline content expand the tile rather than overflow it. */
  grow?: boolean;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const [run, setRun] = useState(0);
  const actions = replay ? (
    <div className="flex items-center gap-1.5">
      <ReplayButton onReplay={() => setRun((count) => count + 1)} />
      {corner}
    </div>
  ) : corner;

  return (
    <SteadySurface
      theme={theme}
      grow={grow}
      className={cn("group/tile site-stage gallery-tile items-center rounded-2xl px-6 sm:px-10", className)}
      style={style}
      overlay={
        <>
          {label ? (
            <span className="pointer-events-none absolute bottom-3 left-4 text-[12px] text-faint opacity-0 transition-opacity duration-150 group-hover/tile:opacity-100 group-focus-within/tile:opacity-100">
              {label}
            </span>
          ) : null}
          {actions ? (
            <div className="absolute top-3 right-3 opacity-0 transition-opacity duration-150 group-hover/tile:opacity-100 group-focus-within/tile:opacity-100 pointer-coarse:opacity-100">
              {actions}
            </div>
          ) : null}
        </>
      }
    >
      <Fragment key={run}>{children}</Fragment>
    </SteadySurface>
  );
}

/** Plays a mount-once animation again by remounting what it sits beside. */
export function ReplayButton({ onReplay }: { onReplay: () => void }) {
  return (
    <button
      type="button"
      onClick={onReplay}
      className="site-chip inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium text-ink"
    >
      <RotateCcw className="size-3" aria-hidden="true" />
      Replay
    </button>
  );
}
