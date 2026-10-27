"use client";

import * as React from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotionConfig,
  type Transition,
} from "motion/react";
import {
  ArrowRight,
  Check,
  Loader2,
  Plus,
  Send,
  Sparkles,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * A pill-shaped text field whose submit button is a droplet of the same
 * liquid. At rest the droplet sits inside the capsule's right end, invisible;
 * on focus it pulls away, stretching a gooey bridge that snaps, and lands
 * beside the field wearing its icon.
 *
 * The liquid is an SVG silhouette layer under a crisp DOM layer: two rounded
 * rects run through a blur-then-alpha-contrast filter (the classic "goo"
 * metaball trick), and the card's shadow is painted on the merged silhouette
 * inside the same filter, so the bridge casts one shadow, not two. The DOM
 * field and button move in lockstep with their rects on one motion
 * transition.
 */

export type GooeyInputIcon = "arrow" | "send" | "sparkles" | "check" | "x" | "plus";

export interface GooeyInputProps {
  /** Input type. `email` switches on the built-in email check. Default `text`. */
  type?: "text" | "email" | "url" | "search" | "tel";
  /** Controlled value. Pair with `onValueChange`. */
  value?: string;
  /** Starting value when uncontrolled. A new value resets the field. */
  defaultValue?: string;
  /** Every keystroke, in both modes. */
  onValueChange?: (value: string) => void;
  /**
   * Form field name. The value is mirrored into a hidden input under this
   * name, so it still posts with the enclosing form while the field is
   * disabled for a pending submit.
   */
  name?: string;
  /** Placeholder, when there is no `label`. */
  placeholder?: string;
  /**
   * Floating label: rests inside the capsule as the placeholder while empty,
   * rides up onto the capsule's top edge on focus or value. Replaces
   * `placeholder` and becomes the field's accessible name.
   */
  label?: string;
  /** Accessible name when there is no visible `label`. */
  ariaLabel?: string;
  /**
   * Button-face text. While the field is empty and blurred the capsule wears
   * this like a button title; focusing it flips it into a plain field.
   */
  restLabel?: string;

  /**
   * Called on Enter or a droplet tap once the value passes validation. Return a
   * promise and the droplet spins while it runs, then shows a tick (or the
   * `failureMessage` if it rejects). Without it, the enclosing form is
   * submitted instead.
   */
  onSubmit?: (value: string) => void | Promise<void>;
  /**
   * Synchronous check before submit. Return a message to show, or null.
   * Defaults to an email check for `type="email"`, otherwise none.
   */
  validate?: (value: string) => string | null;
  /** Shown when submitting an empty field. */
  requiredMessage?: string;
  /** Shown when an `onSubmit` promise rejects. */
  failureMessage?: string;
  /**
   * Live check while typing: debounced, the droplet spins while it runs and
   * shows a tick when the value verifies. A tick is a verdict, not a button —
   * Enter still submits.
   */
  validateAsync?: (value: string) => Promise<string | null>;
  /** Debounce before a live check fires, ms. Default 600. */
  validationDelayMs?: number;
  /** Empty an uncontrolled field after a successful promise submit. */
  clearOnSuccess?: boolean;
  /** Placeholder shown for a moment after a cleared successful submit. */
  successMessage?: string;

  /**
   * External busy flag, for callers that own the async work (a form action in
   * flight). The droplet stays out and spins, field and droplet disable.
   */
  pending?: boolean;
  disabled?: boolean;
  /** Icon the droplet wears. Default `arrow`. */
  buttonIcon?: GooeyInputIcon;
  /** Busy face: a spinner, or a glowing rolling square in the lead colour. */
  loadingIcon?: "spinner" | "square";
  /** Accessible name of the droplet. Default "Submit". */
  submitLabel?: string;
  /**
   * Replaces submit on a droplet tap (e.g. an `x` droplet that dismisses the
   * field). Enter still submits.
   */
  onDropletClick?: () => void;
  /** Accessible name of the droplet when `onDropletClick` is set. */
  dropletLabel?: string;
  /** Escape while focused: abandon the field. */
  onEscape?: () => void;

  /** Height preset. Default `md`. */
  size?: "sm" | "md" | "lg";
  /** Capsule width in px. Defaults by size: 190 / 240 / 270. */
  fieldWidth?: number;
  /**
   * Where the capsule rests. `center` floats it in a roomy stage; `start`
   * puts its left edge on the row's edge, shrinking the capsule (down to
   * 150px) when the row is too narrow for it plus the droplet's travel.
   */
  align?: "center" | "start";
  /** Fill the parent's width (minus the droplet's travel). Implies `start`. */
  fluid?: boolean;

  /** Goo blur sigma in px — how far apart the pieces start bridging. Default 6. */
  gooBlur?: number;
  /** Alpha-contrast slope — how sharp the liquid edge is. Default 14. */
  gooContrast?: number;
  /** Distance in px the droplet travels away on focus. Default 54. */
  gap?: number;
  /** `calm` (640ms, no overshoot) suits forms; `bouncy` (380ms) overshoots. */
  feel?: "calm" | "bouncy";

  maxLength?: number;
  autoComplete?: string;
  autoFocus?: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
  className?: string;
}

/** Narrowest a left-packed capsule shrinks to on a tight row. */
const MIN_FIELD_W = 150;

/**
 * Slack on each side of a fluid stage so the goo has somewhere to paint;
 * pulled back off with a negative margin — it is bleed, not padding.
 */
const FLUID_BLEED = 14;

/** Room past the droplet's landing spot in a left-packed stage. */
const TAIL = 16;

const FEELS = {
  calm: { duration: 0.64, ease: [0.4, 0, 0.2, 1] },
  bouncy: { duration: 0.38, ease: [0.34, 1.56, 0.64, 1] },
} as const satisfies Record<string, { duration: number; ease: [number, number, number, number] }>;

const SIZES = {
  sm: { fieldW: 190, fieldH: 42, btn: 38, icon: 15, text: "text-xs", stageH: 74 },
  md: { fieldW: 240, fieldH: 48, btn: 44, icon: 18, text: "text-sm", stageH: 84 },
  lg: { fieldW: 270, fieldH: 52, btn: 48, icon: 20, text: "text-base", stageH: 92 },
} as const;

/**
 * The card's shadow, as SVG filter passes on the merged silhouette: a 1px
 * ring, a close contact shadow and a soft long one, all mixed from `--ink`
 * so they follow the theme.
 */
const SHADOWS = [
  { dy: 0, blur: 0, spread: 1, color: "color-mix(in oklab, var(--ink) 8%, transparent)" },
  { dy: 2, blur: 6, spread: -1, color: "color-mix(in oklab, var(--ink) 6%, transparent)" },
  { dy: 12, blur: 28, spread: -4, color: "color-mix(in oklab, var(--ink) 10%, transparent)" },
] as const;

/** Snaps the soft goo alpha to a hard mask, for the spread passes. */
const BINARIZE = "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 60 -29.5";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const emailCheck = (v: string) => (EMAIL.test(v.trim()) ? null : "Please enter a valid email");

function GooFilter({
  id,
  blur,
  contrast,
  width,
  height,
}: {
  id: string;
  blur: number;
  contrast: number;
  width: number;
  height: number;
}) {
  const intercept = Math.round((0.5 - contrast * (5 / 12)) * 100) / 100;
  const extent = Math.max(...SHADOWS.map((s) => s.dy + s.blur * 1.5 + Math.max(0, s.spread)));
  const pad = Math.ceil(blur * 3 + extent + 24);
  return (
    <filter
      id={id}
      filterUnits="userSpaceOnUse"
      x={-pad}
      y={-pad}
      width={width + pad * 2}
      height={height + pad * 2}
      colorInterpolationFilters="sRGB"
    >
      <feGaussianBlur in="SourceGraphic" stdDeviation={blur} result="blur" />
      <feColorMatrix
        in="blur"
        type="matrix"
        values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${contrast} ${intercept}`}
        result="goo"
      />
      <feComposite in="SourceGraphic" in2="goo" operator="atop" result="shape" />
      <feColorMatrix in="shape" type="matrix" values={BINARIZE} result="bin" />
      {SHADOWS.map((s, i) => (
        <React.Fragment key={i}>
          <feMorphology
            in="bin"
            operator={s.spread > 0 ? "dilate" : "erode"}
            radius={Math.abs(s.spread)}
            result={`s${i}-sp`}
          />
          <feGaussianBlur in={`s${i}-sp`} stdDeviation={s.blur / 2} result={`s${i}-b`} />
          <feOffset in={`s${i}-b`} dx={0} dy={s.dy} result={`s${i}-o`} />
          <feFlood style={{ floodColor: s.color }} result={`s${i}-c`} />
          <feComposite in={`s${i}-c`} in2={`s${i}-o`} operator="in" result={`s${i}`} />
        </React.Fragment>
      ))}
      <feMerge>
        {SHADOWS.map((_, i) => SHADOWS.length - 1 - i).map((i) => (
          <feMergeNode key={i} in={`s${i}`} />
        ))}
        <feMergeNode in="shape" />
      </feMerge>
    </filter>
  );
}

export function GooeyInput({
  type = "text",
  value,
  defaultValue = "",
  onValueChange,
  name,
  placeholder = "Type here…",
  label,
  ariaLabel,
  restLabel,
  onSubmit,
  validate,
  requiredMessage = "Please enter a value",
  failureMessage = "That didn't go through. Please try again.",
  validateAsync,
  validationDelayMs = 600,
  clearOnSuccess = false,
  successMessage,
  pending = false,
  disabled = false,
  buttonIcon = "arrow",
  loadingIcon = "spinner",
  submitLabel = "Submit",
  onDropletClick,
  dropletLabel = "Close",
  onEscape,
  size = "md",
  fieldWidth,
  align = "center",
  fluid = false,
  gooBlur = 6,
  gooContrast = 14,
  gap = 54,
  feel = "calm",
  maxLength,
  autoComplete = "off",
  autoFocus = false,
  inputRef: externalInputRef,
  className,
}: GooeyInputProps) {
  const reactId = React.useId();
  const uid = reactId.replace(/[^a-zA-Z0-9_-]/g, "");
  const filterId = `gooey-input-${uid}`;
  const messageId = `gooey-input-msg-${uid}`;

  const reduced = useReducedMotionConfig() ?? false;
  const motionSpec = FEELS[feel];
  const travel: Transition = reduced
    ? { duration: 0 }
    : { duration: motionSpec.duration, ease: motionSpec.ease };
  const durationMs = motionSpec.duration * 1000;

  // Value: controlled when `value` is passed, otherwise owned here and reset
  // whenever a new `defaultValue` arrives.
  const [ownValue, setOwnValue] = React.useState(defaultValue);
  const [prevDefault, setPrevDefault] = React.useState(defaultValue);
  if (defaultValue !== prevDefault) {
    setPrevDefault(defaultValue);
    setOwnValue(defaultValue);
  }
  const controlled = value !== undefined;
  const text = controlled ? value : ownValue;

  const [isFocused, setIsFocused] = React.useState(false);
  const [status, setStatus] = React.useState<"idle" | "loading" | "success">("idle");
  const [message, setMessage] = React.useState<string | null>(null);
  const [isPulsing, setIsPulsing] = React.useState(false);

  const fieldRef = React.useRef<HTMLInputElement>(null);
  React.useImperativeHandle(externalInputRef, () => fieldRef.current as HTMLInputElement, []);

  const busy = pending || status === "loading";
  const dropletOut = isFocused || busy;
  const isStart = fluid || align === "start";

  // Every timer this field starts, so unmount can cancel them.
  const timers = React.useRef(new Set<ReturnType<typeof setTimeout>>());
  const later = React.useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(() => {
      timers.current.delete(t);
      fn();
    }, ms);
    timers.current.add(t);
  }, []);
  React.useEffect(() => {
    const scheduled = timers.current;
    return () => scheduled.forEach(clearTimeout);
  }, []);

  const flash = (msg: string) => {
    setMessage(msg);
    later(() => setMessage(null), 2500);
  };

  // Live validation: one check per pause in typing; a stale answer that lands
  // after newer typing is dropped rather than applied.
  const live = validateAsync !== undefined;
  const [checking, setChecking] = React.useState(false);
  const [verdict, setVerdict] = React.useState<boolean | null>(null);
  const checkId = React.useRef(0);
  React.useEffect(() => {
    if (!validateAsync) return;
    const id = ++checkId.current;
    if (!text.trim()) {
      const reset = setTimeout(() => {
        setVerdict(null);
        setChecking(false);
      }, 0);
      return () => clearTimeout(reset);
    }
    const timer = setTimeout(async () => {
      setChecking(true);
      try {
        const problem = await validateAsync(text);
        if (checkId.current === id) setVerdict(problem === null);
      } catch {
        // An unreachable validator is "not confirmed", never "confirmed".
        if (checkId.current === id) setVerdict(false);
      } finally {
        if (checkId.current === id) setChecking(false);
      }
    }, validationDelayMs);
    return () => clearTimeout(timer);
  }, [text, validateAsync, validationDelayMs]);

  // A brief cross-blur on the droplet's icon as it arrives or leaves.
  React.useEffect(() => {
    if (reduced) return;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const raf = requestAnimationFrame(() => {
      setIsPulsing(true);
      timeout = setTimeout(() => setIsPulsing(false), durationMs + 80);
    });
    return () => {
      cancelAnimationFrame(raf);
      if (timeout) clearTimeout(timeout);
    };
  }, [isFocused, durationMs, reduced]);

  // The stage is absolutely laid out in px, so a left-packed or fluid stage
  // has to be told how much room its parent offers. Null until measured, so
  // the server render and first paint use the preset.
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [roomW, setRoomW] = React.useState<number | null>(null);
  React.useEffect(() => {
    if (!isStart) return;
    const parent = rootRef.current?.parentElement;
    if (!parent) return;
    const observer = new ResizeObserver(([entry]) => {
      setRoomW(Math.floor(entry.contentRect.width));
    });
    observer.observe(parent);
    return () => observer.disconnect();
  }, [isStart]);

  const preset = SIZES[size];
  const isFluid = fluid && roomW !== null;
  const preferredW = fieldWidth ?? preset.fieldW;
  const fieldW = isFluid
    ? Math.max(MIN_FIELD_W, roomW - gap)
    : isStart && roomW !== null
      ? Math.max(MIN_FIELD_W, Math.min(preferredW, roomW - gap - TAIL))
      : preferredW;
  const { fieldH, btn: btnSize, icon: iconSize } = preset;
  const stageH = isStart ? fieldH + 10 : preset.stageH;
  const stageW = isFluid
    ? roomW + FLUID_BLEED * 2
    : isStart
      ? Math.ceil(fieldW + gap + TAIL)
      : Math.max(340, fieldW + btnSize + gap + 40);
  const fieldLeft = isFluid ? FLUID_BLEED : isStart ? 0 : stageW / 2 - fieldW / 2 - 10;
  const fieldTop = (stageH - fieldH) / 2;
  const btnLeft = fieldLeft + fieldW - btnSize;
  const btnTop = (stageH - btnSize) / 2;
  // The capsule is furniture and stays put; the droplet travels the whole gap.
  const btnShift = dropletOut ? gap : 0;

  const isFloated = isFocused || text.length > 0;
  const resting = restLabel !== undefined && !isFocused && !text;
  const hasText = text.trim() !== "";
  const liveChecking = live && hasText && (checking || verdict === null);
  const liveTick = live && hasText && !checking && verdict === true;

  const setText = (next: string) => {
    if (!controlled) setOwnValue(next);
    onValueChange?.(next);
    if (message) setMessage(null);
  };

  const submit = async () => {
    if (disabled || busy) return;
    const check = validate ?? (type === "email" ? emailCheck : null);
    const problem = !text.trim() ? requiredMessage : check?.(text) ?? null;
    if (problem) {
      flash(problem);
      return;
    }
    if (!onSubmit) {
      fieldRef.current?.closest("form")?.requestSubmit();
      return;
    }
    const result = onSubmit(text);
    if (!(result instanceof Promise)) return;
    setStatus("loading");
    setMessage(null);
    try {
      await result;
      setStatus("success");
      if (clearOnSuccess && !controlled) setOwnValue("");
      fieldRef.current?.blur();
      later(() => setStatus("idle"), 3500);
    } catch {
      setStatus("idle");
      flash(failureMessage);
    }
  };

  const renderIcon = () => {
    if (busy || liveChecking) {
      if (busy && loadingIcon === "square") {
        return (
          <span
            aria-hidden="true"
            className="size-4.5 animate-spin rounded-sm bg-lead shadow-[0_0_10px_var(--lead)]"
            style={{ animationDuration: "2.5s" }}
          />
        );
      }
      return <Loader2 aria-hidden="true" className="animate-spin" size={iconSize} />;
    }
    if (status === "success" || liveTick) {
      return <Check aria-hidden="true" className="text-go" size={iconSize} />;
    }
    const Icon = {
      arrow: ArrowRight,
      send: Send,
      sparkles: Sparkles,
      check: Check,
      x: X,
      plus: Plus,
    }[buttonIcon];
    return (
      <Icon aria-hidden="true" size={iconSize} className={buttonIcon === "send" ? "ml-0.5" : undefined} />
    );
  };

  const dropletName = busy
    ? `${onDropletClick ? dropletLabel : submitLabel} — working…`
    : liveTick
      ? "Verified"
      : onDropletClick
        ? dropletLabel
        : submitLabel;

  const shownPlaceholder =
    label || resting
      ? undefined
      : status === "success" && clearOnSuccess && successMessage
        ? successMessage
        : placeholder;

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative flex flex-col select-none",
        fluid ? "w-full items-stretch" : "inline-flex",
        !fluid && (isStart ? "items-start" : "items-center"),
        className,
      )}
      style={isFluid ? { marginLeft: -FLUID_BLEED, marginRight: -FLUID_BLEED } : undefined}
    >
      {name && <input type="hidden" name={name} value={text} />}

      <div className="relative isolate" style={{ width: stageW, height: stageH }}>
        {/* Silhouette: the liquid itself, under the crisp content. */}
        <svg
          aria-hidden="true"
          focusable="false"
          className="pointer-events-none absolute inset-0 -z-10 size-full overflow-visible"
          style={{ willChange: "filter, transform" }}
        >
          <defs>
            <GooFilter
              id={filterId}
              blur={gooBlur}
              contrast={gooContrast}
              width={stageW}
              height={stageH}
            />
          </defs>
          <g filter={`url(#${filterId})`} className="fill-card">
            <rect x={fieldLeft} y={fieldTop} width={fieldW} height={fieldH} rx={fieldH / 2} />
            <motion.g initial={false} animate={{ x: btnShift }} transition={travel}>
              <rect x={btnLeft} y={btnTop} width={btnSize} height={btnSize} rx={btnSize / 2} />
            </motion.g>
          </g>
        </svg>

        {/* 1. The capsule. */}
        <div
          className="absolute flex items-center rounded-full"
          style={{ left: fieldLeft, top: fieldTop, width: fieldW, height: fieldH }}
        >
          {label && (
            <span
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute z-10 origin-left font-body transition-all duration-200 ease-out",
                isFloated
                  ? "top-0 left-4 -translate-y-1/2 rounded-full bg-card px-1.5 text-[10px] font-bold tracking-[0.12em] text-faint uppercase"
                  : cn("top-1/2 left-5 -translate-y-1/2 font-medium text-dim", preset.text),
              )}
            >
              {label}
            </span>
          )}

          <input
            ref={fieldRef}
            type={type}
            value={text}
            title={text || undefined}
            autoComplete={autoComplete}
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            autoFocus={autoFocus}
            disabled={disabled || busy}
            maxLength={maxLength}
            placeholder={shownPlaceholder}
            aria-label={label ?? ariaLabel ?? restLabel ?? placeholder}
            aria-invalid={message ? true : undefined}
            aria-describedby={message ? messageId : undefined}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void submit();
              }
              if (e.key === "Escape" && onEscape) {
                e.preventDefault();
                onEscape();
              }
            }}
            className={cn(
              "size-full rounded-full border-0 bg-transparent px-5 font-body font-medium text-ink outline-none transition-colors duration-200 placeholder:text-faint disabled:cursor-not-allowed",
              preset.text,
            )}
          />

          {restLabel !== undefined && (
            <AnimatePresence initial={false}>
              {resting && (
                <motion.span
                  key="rest-label"
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 right-5 left-5 flex items-center justify-center overflow-hidden"
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 1.03 }}
                  transition={reduced ? { duration: 0 } : { duration: 0.32, ease: "easeOut" }}
                >
                  <span className="truncate font-body text-sm font-semibold text-ink">{restLabel}</span>
                </motion.span>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* 2. The droplet. */}
        <motion.div
          className="absolute"
          style={{ left: btnLeft, top: btnTop }}
          initial={false}
          animate={{ x: btnShift }}
          transition={travel}
        >
          <button
            type="button"
            disabled={disabled || busy}
            tabIndex={isFocused ? 0 : -1}
            aria-label={dropletName}
            onPointerDown={(e) => {
              // Keep the field focused through the tap — but only once the
              // droplet is out; while hidden, taps must reach the field.
              if (isFocused) e.preventDefault();
            }}
            onClick={() => {
              if (busy) return;
              // A hidden droplet is a funnel, not a control: a tap on its zone
              // focuses the field.
              if (!isFocused) {
                fieldRef.current?.focus();
                return;
              }
              if (liveChecking || liveTick) return;
              if (onDropletClick) {
                fieldRef.current?.blur();
                onDropletClick();
              } else void submit();
            }}
            className={cn(
              "relative flex items-center justify-center rounded-full border-0 p-0 text-ink transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-95 disabled:cursor-not-allowed",
              dropletOut ? "cursor-pointer hover:bg-paper" : "cursor-text",
            )}
            style={{ width: btnSize, height: btnSize }}
          >
            {/* `filter-none`, not `blur-0`: `blur(0px)` is still a filter and
                would defeat a `backdrop-filter` this field sits inside. */}
            <span
              className={cn(
                "flex items-center justify-center transition-all duration-200",
                dropletOut ? "scale-100 opacity-100" : "pointer-events-none scale-75 opacity-0",
                isPulsing ? "blur-[0.5px]" : "filter-none",
              )}
              style={{
                transitionDelay: dropletOut ? `${Math.round(durationMs * 0.15)}ms` : "0ms",
              }}
            >
              {renderIcon()}
            </span>
          </button>
        </motion.div>
      </div>

      <div
        id={messageId}
        role="status"
        aria-live="polite"
        className={cn(
          "absolute -bottom-6 font-body text-xs font-semibold whitespace-nowrap text-stop",
          isFluid ? "left-[calc(14px+1rem)]" : isStart ? "left-4" : "left-1/2 -translate-x-1/2",
        )}
      >
        {message && (
          <span className="block animate-in duration-200 fade-in slide-in-from-top-1">{message}</span>
        )}
      </div>
    </div>
  );
}
