"use client";

import * as React from "react";
import { CornerDownLeft } from "lucide-react";
import { useReducedMotionConfig } from "motion/react";

import { cn } from "@/lib/utils";

/** Imperative controls, for flows that confirm the value elsewhere (a login that succeeded). */
export type DissolveInputHandle = {
  /** Dissolve whatever the field holds now, then clear it. */
  dissipate: () => void;
  focus: () => void;
  /** The field's live value, including browser autofill React has not seen yet. */
  getValue: () => string;
};

export type DissolveInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "onSubmit" | "value" | "defaultValue" | "color"
> & {
  /** Controlled value. */
  value: string;
  /** Every edit, and `""` once the text has dissolved. */
  onChange: (value: string) => void;
  /**
   * Enter or the action button. Return `false` to keep the text and skip the
   * effect; a throw or rejection shows a retry message under the field.
   */
  onSubmit?: (value: string) => void | boolean | Promise<void | boolean>;
  /** Submit and dissolve on Enter, with a visible action button. Default `true`. */
  dissipateOnEnter?: boolean;
  /** After the last particle has gone and the value has been cleared. */
  onDissipated?: () => void;
  /** Draw the particles from bullets instead of the text. Password inputs always mask. */
  mask?: boolean;
  /** Classes for the `<input>` itself; `className` goes on the underlined wrapper. */
  inputClassName?: string;
  /** Accessible name of the icon-only action button. Default "Submit". */
  submitLabel?: string;
};

/** One dissolve, from the moment the text is frozen until it has gone. */
type Run = { text: string; animate: boolean };

const ERROR_MESSAGE = "Couldn’t submit. Please try again.";

/* ------------------------------------------------------------------------ */
/* Particles                                                                */
/* ------------------------------------------------------------------------ */

/** Hard ceiling on particles, whatever the text's length; cells grow to fit. */
const MAX_PARTICLES = 1600;
/** Smallest square of ink, in CSS px, that one particle carries away. */
const MIN_CELL = 1.5;
/** Rough share of a text's bounding box that is ink, to size cells up front. */
const INK_SHARE = 0.3;
/** Opacity steps particles are batched into: one fill per step per frame. */
const ALPHA_STEPS = 12;
/** Ragged edge of the release wave: each particle leaves up to this late, s. */
const RELEASE_JITTER = 0.08;
/** Each particle's own lifetime, from release to fully faded, s. */
const LIFE_MIN = 0.48;
const LIFE_SPREAD = 0.3;
const TAU = Math.PI * 2;

/**
 * Every particle as parallel typed arrays (positions in device px, times in
 * seconds), plus the release order the ink layer is eaten in.
 */
type Swarm = {
  count: number;
  cell: number;
  cellX: Float32Array;
  cellY: Float32Array;
  x: Float32Array;
  y: Float32Array;
  dx: Float32Array;
  dy: Float32Array;
  release: Float32Array;
  life: Float32Array;
  radius: Float32Array;
  ink: Float32Array;
  phase: Float32Array;
  order: Uint32Array;
  /** When the last particle has faded. */
  duration: number;
};

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const px = (value: string) => parseFloat(value) || 0;

/**
 * Paints `text` onto `ctx` exactly over the input's own text: same font,
 * left padding and scroll, baseline centred the way a browser centres an
 * input's line box. Returns the horizontal band worth sampling, in CSS px.
 */
function paintText(ctx: CanvasRenderingContext2D, input: HTMLInputElement, canvas: HTMLCanvasElement, text: string, dpr: number) {
  const style = getComputedStyle(input);
  const padLeft = px(style.paddingLeft) + px(style.borderLeftWidth);
  const padRight = px(style.paddingRight) + px(style.borderRightWidth);
  const padTop = px(style.paddingTop) + px(style.borderTopWidth);
  const padBottom = px(style.paddingBottom) + px(style.borderBottomWidth);

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  if (style.letterSpacing !== "normal") ctx.letterSpacing = style.letterSpacing;
  ctx.fillStyle = style.color;
  ctx.textBaseline = "alphabetic";

  const metrics = ctx.measureText(text);
  const width = metrics.width;
  // Offsets, not client rects, so a scaled ancestor cannot skew the match.
  const left = input.offsetLeft - canvas.offsetLeft + padLeft;
  const room = input.offsetWidth - padLeft - padRight;
  let x = left - input.scrollLeft;
  if (width < room && style.textAlign === "center") x = left + (room - width) / 2;
  else if (width < room && (style.textAlign === "right" || style.textAlign === "end")) x = left + room - width;

  const centre = input.offsetTop - canvas.offsetTop + padTop + (input.offsetHeight - padTop - padBottom) / 2;
  const ascent = metrics.fontBoundingBoxAscent || metrics.actualBoundingBoxAscent;
  const descent = metrics.fontBoundingBoxDescent || metrics.actualBoundingBoxDescent;
  ctx.fillText(text, x, centre + (ascent - descent) / 2);
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  const size = px(style.fontSize);
  return { from: x - size * 0.3, to: x + width + size * 0.3, size, color: style.color };
}

/**
 * Cuts the painted ink into square cells and keeps every cell with any ink
 * in it, as [left, top, centroid x, centroid y, coverage] runs.
 */
function cutCells(data: Uint8ClampedArray, width: number, height: number, from: number, to: number, cell: number) {
  const cells: number[] = [];
  const x0 = clamp(Math.floor(from), 0, width);
  const x1 = clamp(Math.ceil(to), 0, width);
  for (let top = 0; top < height; top += cell) {
    const bottom = Math.min(top + cell, height);
    for (let left = x0; left < x1; left += cell) {
      const right = Math.min(left + cell, x1);
      let sum = 0;
      let sx = 0;
      let sy = 0;
      for (let y = top; y < bottom; y++) {
        for (let x = left; x < right; x++) {
          const a = data[(y * width + x) * 4 + 3];
          if (!a) continue;
          sum += a;
          sx += a * x;
          sy += a * y;
        }
      }
      if (sum) cells.push(left, top, sx / sum + 0.5, sy / sum + 0.5, sum / (cell * cell * 255));
    }
  }
  return cells;
}

/**
 * Turns the ink into a swarm. Cell size adapts to the text's width so a long
 * value never exceeds MAX_PARTICLES. Release runs as a wave from the right
 * edge to the left, each particle a little late at random; once out, it
 * drifts up and to the left on its own heading, swells and fades.
 */
function buildSwarm(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  band: { from: number; to: number; size: number },
  dpr: number,
): Swarm | null {
  const from = band.from * dpr;
  const to = band.to * dpr;
  const span = clamp(to - from, 0, width);
  let cell = Math.max(1, Math.round(MIN_CELL * dpr));
  const estimate = (span * band.size * dpr * INK_SHARE) / MAX_PARTICLES;
  if (estimate > cell * cell) cell = Math.ceil(Math.sqrt(estimate));

  let cells = cutCells(data, width, height, from, to, cell);
  for (let tries = 0; cells.length / 5 > MAX_PARTICLES && tries < 6; tries++) {
    cell = Math.ceil(cell * Math.sqrt(cells.length / 5 / MAX_PARTICLES));
    cells = cutCells(data, width, height, from, to, cell);
  }
  const count = cells.length / 5;
  if (!count) return null;

  const f32 = () => new Float32Array(count);
  const swarm: Swarm = {
    count, cell,
    cellX: f32(), cellY: f32(), x: f32(), y: f32(), dx: f32(), dy: f32(),
    release: f32(), life: f32(), radius: f32(), ink: f32(), phase: f32(),
    order: new Uint32Array(count),
    duration: 0,
  };

  let minX = Infinity;
  let maxX = -Infinity;
  for (let i = 0; i < count; i++) {
    minX = Math.min(minX, cells[i * 5 + 2]);
    maxX = Math.max(maxX, cells[i * 5 + 2]);
  }
  const reach = Math.max(1, maxX - minX);
  // Wider text sweeps for longer, but the whole run stays near a second.
  const sweep = clamp(0.2 + reach / dpr / 900, 0.22, 0.55);

  for (let i = 0; i < count; i++) {
    const o = i * 5;
    swarm.cellX[i] = cells[o];
    swarm.cellY[i] = cells[o + 1];
    swarm.x[i] = cells[o + 2];
    swarm.y[i] = cells[o + 3];
    swarm.ink[i] = Math.min(1, cells[o + 4] * 1.3);
    // 0 at the right edge, 1 at the left: the right goes first.
    const fromRight = (maxX - swarm.x[i]) / reach;
    swarm.release[i] = sweep * fromRight + Math.random() * RELEASE_JITTER;
    swarm.life[i] = LIFE_MIN + Math.random() * LIFE_SPREAD;
    // The canvas is the field's own box, so drift is steered short of its
    // left and top edges (never below a quarter of the intended distance).
    const drift = (10 + Math.random() * 26) * dpr;
    const rise = (2 + Math.random() * 11) * dpr;
    swarm.dx[i] = -Math.max(drift * 0.25, Math.min(drift, swarm.x[i] * 0.9));
    swarm.dy[i] = -Math.max(rise * 0.25, Math.min(rise, swarm.y[i] * 0.85));
    swarm.radius[i] = cell * 0.5 * (0.85 + Math.random() * 0.45);
    swarm.phase[i] = Math.random() * TAU;
    swarm.order[i] = i;
    swarm.duration = Math.max(swarm.duration, swarm.release[i] + swarm.life[i]);
  }
  swarm.order.sort((a, b) => swarm.release[a] - swarm.release[b]);
  return swarm;
}

/**
 * Freezes `text` onto `canvas` over the input and plays it away. Each frame
 * is a pure function of elapsed time, so frame rate only changes smoothness.
 * The crisp text lives on an offscreen ink layer that particles are bitten
 * out of as they release, so the text stays sharp until it moves.
 *
 * Returns a stop function, or null when the effect cannot run here (no 2D
 * context, nothing visible, or the pixels could not be read).
 */
function playDissipation(
  canvas: HTMLCanvasElement,
  input: HTMLInputElement,
  text: string,
  onDone: () => void,
): (() => void) | null {
  const ctx = canvas.getContext("2d");
  const layer = document.createElement("canvas");
  const inkCtx = layer.getContext("2d");
  if (!ctx || !inkCtx) return null;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.round(canvas.offsetWidth * dpr);
  const height = Math.round(canvas.offsetHeight * dpr);
  if (!width || !height) return null;
  canvas.width = layer.width = width;
  canvas.height = layer.height = height;

  let swarm: Swarm | null;
  let color: string;
  try {
    const band = paintText(inkCtx, input, canvas, text, dpr);
    color = band.color;
    swarm = buildSwarm(inkCtx.getImageData(0, 0, width, height).data, width, height, band, dpr);
  } catch {
    return null;
  }
  if (!swarm) return null;
  const { count, cell, order, release, life } = swarm;

  // First frame now, before paint: the input's text is already hidden.
  ctx.drawImage(layer, 0, 0);
  ctx.fillStyle = color;

  const start = performance.now();
  let released = 0;
  let frame = 0;

  const draw = (t: number) => {
    // Bite newly released cells out of the crisp layer, once each.
    for (; released < count && release[order[released]] <= t; released++) {
      const i = order[released];
      inkCtx.clearRect(swarm.cellX[i], swarm.cellY[i], cell, cell);
    }
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(layer, 0, 0);

    const batches: (Path2D | undefined)[] = [];
    for (let k = 0; k < released; k++) {
      const i = order[k];
      const p = (t - release[i]) / life[i];
      if (p >= 1) continue;
      const left = 1 - p;
      const step = Math.round(swarm.ink[i] * left * left * ALPHA_STEPS);
      if (step <= 0) continue;
      const travel = 1 - left * left * left;
      const r = swarm.radius[i] * (1 + 0.6 * p);
      const x = swarm.x[i] + swarm.dx[i] * travel;
      const y = swarm.y[i] + swarm.dy[i] * travel + Math.sin(swarm.phase[i] + p * 7) * 1.2 * dpr * p;
      const path = (batches[step] ??= new Path2D());
      path.moveTo(x + r, y);
      path.arc(x, y, r, 0, TAU);
    }
    for (let step = 1; step <= ALPHA_STEPS; step++) {
      const path = batches[step];
      if (!path) continue;
      ctx.globalAlpha = step / ALPHA_STEPS;
      ctx.fill(path);
    }
    ctx.globalAlpha = 1;
  };

  const tick = (now: number) => {
    const t = Math.max(0, (now - start) / 1000);
    if (t >= swarm.duration) {
      ctx.clearRect(0, 0, width, height);
      onDone();
      return;
    }
    draw(t);
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(frame);
    ctx.clearRect(0, 0, width, height);
  };
}

/* ------------------------------------------------------------------------ */
/* Component                                                                */
/* ------------------------------------------------------------------------ */

/**
 * An underlined single-value field whose text dissolves into drifting dust,
 * right to left, once it is submitted. Enter (or the round action button)
 * calls `onSubmit`; unless that returns `false` the text blows away and the
 * value clears for another go. For a login, set `dissipateOnEnter={false}`
 * and call `ref.dissipate()` only once the credentials are accepted.
 *
 * The particles are drawn from the input's own computed font and colour, so
 * the field follows the theme. Reduced motion skips the animation and just
 * clears.
 *
 * The idea of text dissolving into particles was popularised by Miguel
 * Piedrafita (m1guelpf); this implementation is written from scratch.
 */
export const DissolveInput = React.forwardRef<DissolveInputHandle, DissolveInputProps>(function DissolveInput(
  {
    value,
    onChange,
    onSubmit,
    dissipateOnEnter = true,
    onDissipated,
    mask = false,
    inputClassName,
    submitLabel = "Submit",
    className,
    style,
    type,
    placeholder = "Type and press Enter…",
    disabled = false,
    onKeyDown,
    "aria-label": ariaLabel,
    "aria-describedby": ariaDescribedBy,
    "aria-invalid": ariaInvalid,
    ...inputProps
  },
  ref,
) {
  const reduceMotion = useReducedMotionConfig();
  const errorId = React.useId();
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  // Same-tick guards: state lags a render behind a double Enter or click.
  const submittingRef = React.useRef(false);
  const runningRef = React.useRef(false);
  /** Disabling the field drops its focus; give it back when the work is done. */
  const refocusRef = React.useRef(false);

  const [pending, setPending] = React.useState(false);
  const [run, setRun] = React.useState<Run | null>(null);
  const [failed, setFailed] = React.useState(false);

  const busy = pending || run !== null;
  const masked = mask || type === "password";

  const liveValue = () => inputRef.current?.value || value;

  const holdFocus = () => {
    if (wrapperRef.current?.contains(document.activeElement)) refocusRef.current = true;
  };

  const dissipate = () => {
    if (runningRef.current) return;
    const text = liveValue();
    if (!text) {
      onDissipated?.();
      return;
    }
    runningRef.current = true;
    holdFocus();
    setRun({ text: masked ? "•".repeat([...text].length) : text, animate: !reduceMotion });
  };

  const submit = async () => {
    const input = inputRef.current;
    if (!input || disabled || submittingRef.current || runningRef.current) return;
    const text = liveValue();
    if (!text || !input.checkValidity()) {
      input.reportValidity();
      return;
    }
    submittingRef.current = true;
    holdFocus();
    setFailed(false);
    setPending(true);
    try {
      const result = await onSubmit?.(text);
      if (result !== false) dissipate();
    } catch {
      setFailed(true);
    } finally {
      submittingRef.current = false;
      setPending(false);
    }
  };

  React.useImperativeHandle(ref, () => ({
    dissipate,
    focus: () => inputRef.current?.focus(),
    getValue: liveValue,
  }));

  /** Restores the field and clears the value; only ever called from the run's frame loop. */
  const finishRun = React.useEffectEvent(() => {
    runningRef.current = false;
    setRun(null);
    onChange("");
    onDissipated?.();
  });

  React.useLayoutEffect(() => {
    if (!run) return;
    const canvas = canvasRef.current;
    const input = inputRef.current;
    const stop = run.animate && canvas && input ? playDissipation(canvas, input, run.text, () => finishRun()) : null;
    if (stop) return stop;
    // No animation here: finish on the next frame instead.
    const frame = requestAnimationFrame(() => finishRun());
    return () => cancelAnimationFrame(frame);
  }, [run]);

  React.useEffect(() => {
    if (busy || !refocusRef.current) return;
    refocusRef.current = false;
    // Only reclaim focus that was dropped, never focus the caller moved on purpose.
    if (document.activeElement && document.activeElement !== document.body) return;
    inputRef.current?.focus();
  }, [busy]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || !dissipateOnEnter || event.key !== "Enter") return;
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    event.preventDefault();
    void submit();
  };

  const describedBy = [ariaDescribedBy, failed ? errorId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div
      ref={wrapperRef}
      className={cn(
        "relative flex w-full items-center gap-2 border-b-2 border-primary pb-1 font-body",
        disabled && "opacity-50",
        className,
      )}
    >
      <div className="relative min-w-0 flex-1">
        <input
          {...inputProps}
          ref={inputRef}
          type={type}
          value={value}
          placeholder={placeholder}
          disabled={disabled || busy}
          aria-label={ariaLabel ?? placeholder}
          aria-busy={busy || undefined}
          aria-invalid={failed ? true : ariaInvalid}
          aria-describedby={describedBy}
          onChange={(event) => {
            onChange(event.target.value);
            if (failed) setFailed(false);
          }}
          onKeyDown={handleKeyDown}
          // Hidden, not removed, so the field keeps its size under the canvas.
          style={run ? { ...style, opacity: 0 } : style}
          className={cn(
            "min-h-11 w-full appearance-none border-0 bg-transparent py-1 text-2xl font-medium text-ink outline-none placeholder:text-faint focus-visible:ring-2 focus-visible:ring-lead/20",
            inputClassName,
          )}
        />
        <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 size-full" />
      </div>
      {dissipateOnEnter && value ? (
        <button
          type="button"
          onClick={() => void submit()}
          disabled={disabled || busy}
          aria-label={pending ? "Submitting" : run ? "Processing" : submitLabel}
          aria-keyshortcuts="Enter"
          title={`${submitLabel} (Enter)`}
          className={cn(
            "inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lead disabled:cursor-not-allowed",
            // A disabled field is already dimmed as a whole; only dim the button for busy.
            !disabled && "disabled:opacity-50",
          )}
        >
          <CornerDownLeft aria-hidden="true" className="size-4" />
        </button>
      ) : null}
      {failed ? (
        <p id={errorId} role="alert" className="absolute top-full left-0 mt-2 text-xs text-stop">
          {ERROR_MESSAGE}
        </p>
      ) : null}
    </div>
  );
});

DissolveInput.displayName = "DissolveInput";

export default DissolveInput;
