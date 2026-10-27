"use client";

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { Target, type LucideIcon } from "lucide-react";
import { AnimatePresence, motion, useReducedMotionConfig } from "motion/react";

import { cn } from "@/lib/utils";

export type QueueSegment = {
  id: string;
  label: string;
  value: number;
  /** Any CSS colour. Defaults run ink → dim → faint → rule, darkest first. */
  color?: string;
};

export interface BreakdownDialProps {
  /** The groups, best first. Every one keeps a row; only those above zero get ticks. */
  segments: QueueSegment[];
  /** The figure in the dial's centre and the base for each row's share. Defaults to the segments' sum. */
  total?: number;
  title?: ReactNode;
  /** Header and centre icon. Default a target. */
  icon?: LucideIcon;
  /** Word above the centre figure. Default "Total". */
  totalLabel?: string;
  /** Formats counts in the rows, centre and tooltip. Default toLocaleString. */
  valueFormatter?: (value: number) => string;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

/** Darkest first, so the best group reads strongest and the remainder recedes. */
const DEFAULT_COLORS = ["var(--ink)", "var(--dim)", "var(--faint)", "var(--rule)"];

const TOTAL_TICKS = 42;
const START_ANGLE_DEG = 135; // bottom-left
const SWEEP_ANGLE_DEG = 270; // leaves the bottom open
const CX = 100;
const CY = 100;
const R_INNER = 68;
const R_OUTER = 84;

type Resolved = QueueSegment & { color: string; share: string };

const round3 = (n: number) => Math.round(n * 1000) / 1000;

export function BreakdownDial({
  segments: segmentsProp,
  total: totalProp,
  title = "Queue quality",
  icon: Icon = Target,
  totalLabel = "Total",
  valueFormatter = (value) => value.toLocaleString(),
  emptyTitle = "Nothing in the queue yet",
  emptyDescription = "Groups will appear here once items are scored.",
  className,
}: BreakdownDialProps) {
  const cardId = useId().replace(/:/g, "");
  const rootRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotionConfig() ?? false;
  const [hoveredSegmentId, setHoveredSegmentId] = useState<string | null>(null);
  const [hasEnteredView, setHasEnteredView] = useState(false);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasEnteredView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const total = totalProp ?? segmentsProp.reduce((sum, s) => sum + Math.max(0, s.value), 0);

  const segments = useMemo<Resolved[]>(
    () =>
      segmentsProp.map((s, i) => ({
        ...s,
        color: s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length],
        share: total > 0 ? `${Math.round((Math.max(0, s.value) / total) * 100)}%` : "—",
      })),
    [segmentsProp, total],
  );

  // Only groups with a value get ticks, so a single 100% group fills the dial.
  const visibleSegments = useMemo(() => {
    const filtered = segments.filter((s) => s.value > 0);
    return filtered.length ? filtered : segments;
  }, [segments]);

  const ticks = useMemo(() => {
    if (visibleSegments.length === 0) return [];
    const totalVal = visibleSegments.reduce((sum, s) => sum + s.value, 0) || 1;
    const ranges: { segment: Resolved; startTick: number; endTick: number }[] = [];
    let acc = 0;
    for (const seg of visibleSegments) {
      const startTick = Math.round((acc / totalVal) * TOTAL_TICKS);
      acc += seg.value;
      ranges.push({ segment: seg, startTick, endTick: Math.round((acc / totalVal) * TOTAL_TICKS) });
    }

    return Array.from({ length: TOTAL_TICKS }, (_, i) => {
      const angleRad = ((START_ANGLE_DEG + (i / (TOTAL_TICKS - 1)) * SWEEP_ANGLE_DEG) * Math.PI) / 180;
      const cos = Math.cos(angleRad);
      const sin = Math.sin(angleRad);
      const segment =
        ranges.find((range) => i >= range.startTick && i <= range.endTick)?.segment ?? ranges[0].segment;
      return {
        index: i,
        x1: round3(CX + R_INNER * cos),
        y1: round3(CY + R_INNER * sin),
        x2: round3(CX + R_OUTER * cos),
        y2: round3(CY + R_OUTER * sin),
        segment,
      };
    });
  }, [visibleSegments]);

  const activeSegment = segments.find((s) => s.id === hoveredSegmentId) ?? visibleSegments[0];

  // Only hide other ticks when the hovered group actually has ticks.
  const isTicksHovered =
    hoveredSegmentId !== null && visibleSegments.some((s) => s.id === hoveredSegmentId);

  const revealed = hasEnteredView || reduceMotion;

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative flex w-full flex-col justify-between overflow-hidden rounded-panel border border-rule bg-card p-6 font-body shadow-sm transition-all",
        className,
      )}
    >
      <div>
        <div className="flex items-center gap-2.5 pb-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground">
            <Icon size={18} strokeWidth={2.2} className="opacity-80" />
          </div>
          <h3 className="text-[20px] font-medium tracking-tighter text-foreground">{title}</h3>
        </div>

        {total === 0 || segments.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-1 py-12 text-center">
            <p className="text-sm font-medium text-foreground">{emptyTitle}</p>
            <p className="text-xs text-muted-foreground">{emptyDescription}</p>
          </div>
        ) : (
          <>
            <div className="relative mx-auto mt-4 flex aspect-square w-full max-w-[260px] items-center justify-center">
              <svg viewBox="0 0 200 200" className="h-full w-full select-none overflow-visible" aria-hidden="true">
                {ticks.map((tick) => {
                  const isSegmentActive = activeSegment?.id === tick.segment.id;
                  const opacity = !isTicksHovered ? 1 : isSegmentActive ? 1 : 0;
                  return (
                    <motion.line
                      key={`tick-${cardId}-${tick.index}`}
                      x1={tick.x1}
                      y1={tick.y1}
                      x2={tick.x2}
                      y2={tick.y2}
                      stroke={tick.segment.color}
                      strokeWidth={3}
                      strokeLinecap="round"
                      initial={reduceMotion ? false : { opacity: 0, pathLength: 0 }}
                      animate={{
                        opacity: revealed ? opacity : 0,
                        pathLength: revealed ? 1 : 0,
                        strokeWidth: isSegmentActive && isTicksHovered ? 3.5 : 3,
                      }}
                      transition={{
                        opacity: { duration: 0.25 },
                        pathLength: { duration: reduceMotion ? 0 : 0.55, ease: "easeOut" },
                        strokeWidth: { duration: 0.2 },
                      }}
                      onPointerEnter={() => setHoveredSegmentId(tick.segment.id)}
                      onPointerLeave={() => setHoveredSegmentId(null)}
                    />
                  );
                })}
              </svg>

              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-paper text-ink">
                  <Icon size={16} strokeWidth={2.2} />
                </div>
                <span className="mt-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {totalLabel}
                </span>
                <span className="text-[26px] font-bold leading-none tracking-tight text-foreground tabular-nums">
                  {valueFormatter(total)}
                </span>
              </div>

              <AnimatePresence>
                {hoveredSegmentId && activeSegment && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 4 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="pointer-events-none absolute bottom-8 right-0 z-30 min-w-[130px] rounded-xl border border-rule bg-popover/95 px-3 py-2 shadow-lg backdrop-blur-md"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ background: activeSegment.color }} />
                      <span className="text-[12px] font-bold text-foreground">{activeSegment.label}</span>
                    </div>
                    <div className="mt-1 text-[13px] font-semibold tabular-nums text-foreground">
                      {valueFormatter(activeSegment.value)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Every group keeps its row, at 0% if empty, so the reader sees all the options. */}
            <div className="mt-4 space-y-2 border-t border-rule-soft pt-4">
              {segments.map((seg) => (
                <div
                  key={seg.id}
                  className={cn(
                    "flex cursor-pointer items-center justify-between rounded-xl px-2.5 py-1.5 transition-colors",
                    hoveredSegmentId === seg.id ? "bg-paper" : "hover:bg-paper",
                  )}
                  onPointerEnter={() => setHoveredSegmentId(seg.id)}
                  onPointerLeave={() => setHoveredSegmentId(null)}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="h-4 w-1.5 rounded-full" style={{ background: seg.color }} />
                    <span className="text-[13px] font-medium text-foreground">{seg.label}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[13px] tabular-nums">
                    <span className="font-bold text-foreground">{valueFormatter(seg.value)}</span>
                    <span className="text-[12px] font-medium text-muted-foreground">{seg.share}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default BreakdownDial;
