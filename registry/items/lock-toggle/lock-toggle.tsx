"use client";

import * as React from "react";
import { useReducedMotionConfig } from "motion/react";
import { cva } from "class-variance-authority";
import { Lock, Unlock } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * An instant on/off switch in Material Design 3's physics, drawn in the
 * theme's tokens, whose knob carries a lock when on and an open lock when off.
 *
 * A switch says "this is on, and flipping it is immediate". Use it where the
 * flip *is* the save: a protection going on or off, a setting that applies at
 * once. Where the answer is part of a form submitted later, use a checkbox.
 *
 * `tone` names the colour of the *on* state. `stop` (the default) is for a
 * switch where turning it off is the risky direction, such as disarming a
 * protection: the live, about-to-be-disarmed thing is what wears the colour.
 * `go` is a healthy on, `lead` a neutral one.
 *
 * Under the track is a real checkbox input with `role="switch"`, hidden and
 * driven by the track, so Space, a wrapping or pointing `<label>` and screen
 * readers all treat it as a switch. Controlled when `checked` is given: the
 * knob follows the caller, so a switch that asks for confirmation before
 * turning off stays visibly on until the answer is in.
 *
 * The knob grows when pressed and again when it carries an icon, the icon
 * rotates in, and a halo of the same tone swells under the pointer. Reduced
 * motion drops every transition and the switch simply changes state.
 */
export type LockToggleTone = "lead" | "go" | "stop";
export type LockToggleSize = "sm" | "md";

const trackVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-rule bg-paper-sunk transition-colors duration-300 peer-disabled:cursor-not-allowed",
  {
    variants: {
      tone: {
        lead: "peer-checked:border-lead peer-checked:bg-lead",
        go: "peer-checked:border-go peer-checked:bg-go",
        stop: "peer-checked:border-stop peer-checked:bg-stop",
      },
      size: {
        md: "h-8 w-[52px]",
        sm: "h-6 w-10",
      },
    },
    defaultVariants: { tone: "stop", size: "md" },
  },
);

/** The knob's icon colour and the halo, per tone, painted over the track. */
const TONES: Record<LockToggleTone, { onIcon: string; halo: string }> = {
  lead: { onIcon: "text-lead", halo: "bg-lead" },
  go: { onIcon: "text-go", halo: "bg-go" },
  stop: { onIcon: "text-stop", halo: "bg-stop" },
};

/** M3's spring, as a CSS easing so the slide overshoots and settles. */
const SPRING_EASE = "ease-[cubic-bezier(0.175,0.885,0.32,1.275)]";

/**
 * A synthesised click through the Web Audio API. Off by default: a settings
 * screen that makes a noise is a surprise in a shared office, and a setting's
 * state should never depend on the sound card.
 */
function playHaptic(type: "heavy" | "light" | "none") {
  if (type === "none" || typeof window === "undefined") return;
  try {
    const AudioContextClass =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    if (type === "heavy") {
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(180, now);
      oscillator.frequency.exponentialRampToValueAtTime(40, now + 0.15);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      oscillator.start(now);
      oscillator.stop(now + 0.15);
    } else {
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      oscillator.start(now);
      oscillator.stop(now + 0.08);
    }
    // One context per click, closed when the sound ends: browsers cap how many
    // can exist, so leaving them open would silence a much-flipped switch.
    oscillator.onended = () => void ctx.close();
  } catch {
    // No sound is fine; the switch still works.
  }
}

export interface LockToggleProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "size" | "type" | "checked" | "defaultChecked" | "onChange"
  > {
  ref?: React.Ref<HTMLInputElement>;
  /** Controlled state. Leave undefined for an uncontrolled switch. */
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** Colour of the on state. `stop` when turning it off is the risky direction. Default `stop`. */
  tone?: LockToggleTone;
  size?: LockToggleSize;
  /** Show an icon in the knob. Default true. */
  showIcons?: boolean;
  /** Icon in the knob when on. Default a closed lock. */
  checkedIcon?: React.ReactNode;
  /** Icon in the knob when off. Default an open lock. */
  uncheckedIcon?: React.ReactNode;
  /** A synthesised click on toggle. Default "none". */
  haptic?: "heavy" | "light" | "none";
  /** Classes for the track. */
  className?: string;
}

export function LockToggle({
  ref,
  className,
  size = "md",
  tone = "stop",
  checked,
  defaultChecked,
  onCheckedChange,
  showIcons = true,
  checkedIcon,
  uncheckedIcon,
  haptic = "none",
  disabled,
  style,
  role = "switch",
  ...props
}: LockToggleProps) {
  const reduceMotion = useReducedMotionConfig();
  const [uncontrolledChecked, setUncontrolledChecked] = React.useState(defaultChecked ?? false);
  const isChecked = checked ?? uncontrolledChecked;
  const [isPressed, setIsPressed] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const next = event.target.checked;
    playHaptic(haptic);
    if (checked === undefined) setUncontrolledChecked(next);
    onCheckedChange?.(next);
  };

  const isSmall = size === "sm";
  const toneClasses = TONES[tone];
  const iconSize = isSmall ? "size-2.5" : "size-3";
  const still = reduceMotion ? "transition-none" : undefined;

  const knobSize = isPressed
    ? isSmall
      ? "size-5 -ml-[2px]"
      : "size-7 -ml-[2px]"
    : isChecked || (showIcons && !isSmall)
      ? isSmall
        ? "size-4"
        : "size-6"
      : isSmall
        ? "size-3 ml-[2px]"
        : "size-4 ml-[2px]";

  return (
    <label
      className={cn(
        "group relative inline-flex min-h-12 min-w-12 items-center justify-center",
        disabled && "cursor-not-allowed opacity-50",
      )}
      style={style}
      onPointerDown={() => !disabled && setIsPressed(true)}
      onPointerUp={() => setIsPressed(false)}
      onPointerLeave={() => {
        setIsPressed(false);
        setIsHovered(false);
      }}
      onPointerEnter={() => !disabled && setIsHovered(true)}
    >
      <input
        ref={ref}
        type="checkbox"
        role={role}
        className="peer sr-only"
        checked={isChecked}
        onChange={handleChange}
        disabled={disabled}
        {...props}
      />

      {/* Track. The focus ring is drawn here: the input is sr-only. */}
      <span
        aria-hidden="true"
        className={cn(
          trackVariants({ tone, size }),
          "peer-focus-visible:ring-2 peer-focus-visible:ring-lead/30 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-card",
          still,
          className,
        )}
      >
        {/* Knob carrier: slides the knob and halo together. */}
        <span
          className={cn(
            "pointer-events-none relative block h-full w-full transition-all duration-300",
            SPRING_EASE,
            isChecked ? (isSmall ? "translate-x-[16px]" : "translate-x-[20px]") : "translate-x-0",
            still,
          )}
        >
          {/* Knob */}
          <span
            className={cn(
              "absolute top-1/2 left-[2px] flex -translate-y-1/2 items-center justify-center rounded-full bg-card transition-all duration-300",
              isChecked ? toneClasses.onIcon : "text-faint",
              knobSize,
              still,
            )}
          >
            {showIcons && (
              <span className="relative flex h-full w-full items-center justify-center overflow-hidden">
                <span
                  className={cn(
                    "absolute inset-0 flex items-center justify-center transition-all duration-300",
                    isChecked ? "scale-100 rotate-0 opacity-100" : "scale-50 -rotate-45 opacity-0",
                    still,
                  )}
                >
                  {checkedIcon ?? <Lock className={iconSize} strokeWidth={2.5} />}
                </span>
                <span
                  className={cn(
                    "absolute inset-0 flex items-center justify-center text-faint transition-all duration-300",
                    !isChecked ? "scale-100 rotate-0 opacity-100" : "scale-50 rotate-45 opacity-0",
                    still,
                  )}
                >
                  {uncheckedIcon ?? <Unlock className={iconSize} strokeWidth={2.5} />}
                </span>
              </span>
            )}
          </span>

          {/* Halo: the same tone at 5% on hover and 10% while pressed. */}
          <span
            className={cn(
              "pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-200",
              isSmall ? "size-8" : "size-10",
              isChecked ? toneClasses.halo : "bg-faint",
              isPressed
                ? "scale-100 opacity-10"
                : isHovered
                  ? "scale-100 opacity-5"
                  : "scale-50 opacity-0",
              isSmall
                ? isChecked
                  ? "left-[10px]"
                  : "left-[8px]"
                : isChecked || showIcons
                  ? "left-[14px]"
                  : "left-[10px]",
              still,
            )}
          />
        </span>
      </span>
    </label>
  );
}
