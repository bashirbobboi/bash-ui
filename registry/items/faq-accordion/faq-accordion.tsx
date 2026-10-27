"use client";

import * as React from "react";
import { Accordion as AccordionPrimitive } from "radix-ui";
import { motion, useReducedMotionConfig } from "motion/react";

import { cn } from "@/lib/utils";

export type AccordionEntry = {
  /** Stable id; also the value reported by `onValueChange`. */
  id: string;
  question: React.ReactNode;
  answer: React.ReactNode;
  disabled?: boolean;
};

type SharedProps = {
  /** The questions and answers, in order. */
  items: AccordionEntry[];
  /** Side of the plus/minus mark, in pixels. Defaults to 24. */
  iconSize?: number;
  /** Disables every item. */
  disabled?: boolean;
  className?: string;
};

type SingleProps = SharedProps & {
  /** One item open at a time (default). */
  type?: "single";
  /** Whether the open item can be closed again by pressing it. Defaults to true. */
  collapsible?: boolean;
  /** The open item's id, when controlled. `""` closes everything. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
};

type MultipleProps = SharedProps & {
  /** Any number of items open at once. */
  type: "multiple";
  collapsible?: never;
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
};

export type FaqAccordionProps = SingleProps | MultipleProps;

/**
 * One soft, hand-cut bar (viewBox 0 0 24 4). The plus is two of them; opening
 * an item turns the upright one flat until the two read as a single minus.
 */
const BAR =
  "M23.9941 1.99953C24.0205 2.26456 23.9549 2.54436 23.7803 2.80742C23.4141 3.35816 22.8098 3.53944 22.1716 3.49313C21.435 3.43993 20.6984 3.31481 19.9766 3.16111C18.6188 2.87244 14.1324 2.67934 11.9999 2.59362C9.86733 2.67934 5.37996 2.87244 4.02317 3.16111C3.30032 3.31481 2.56478 3.43993 1.82711 3.49313C1.18999 3.53944 0.584621 3.35816 0.219493 2.80742C0.0438085 2.54436 -0.0207503 2.26554 0.00570827 2.00052C-0.0207503 1.73549 0.0438085 1.45569 0.219493 1.19264C0.584621 0.641899 1.18999 0.460618 1.82711 0.506923C2.56478 0.560125 3.30032 0.685249 4.02317 0.838943C5.37996 1.12761 9.86733 1.31973 11.9999 1.40643C14.1324 1.31973 18.6188 1.12761 19.9766 0.838943C20.6984 0.685249 21.435 0.560125 22.1716 0.506923C22.8098 0.460618 23.4141 0.641899 23.7803 1.19264C23.9549 1.45569 24.0205 1.73451 23.9941 1.99953Z";

function PlusMinusIcon({ open, size, reduceMotion }: { open: boolean; size: number; reduceMotion: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className="shrink-0"
    >
      <g transform="translate(12 12) scale(0.85) translate(-12 -12)">
        <path d={BAR} transform="translate(0 10)" />
        {/* The upright bar: 90° is a plus, 0° lies on the flat bar as a minus. */}
        <motion.g
          initial={false}
          animate={{ rotate: open ? 0 : 90 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.45, ease: "easeInOut" }}
          style={{ transformBox: "view-box", transformOrigin: "12px 12px" }}
        >
          <path d={BAR} transform="translate(0 10)" />
        </motion.g>
      </g>
    </svg>
  );
}

function toOpenList(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

/**
 * A question-and-answer list. Each question carries an organic plus whose
 * upright bar turns flat into a minus as the answer unblurs open beneath it.
 *
 * The open set lives here (or with the caller, when `value` is passed), so the
 * mark and the reveal read it directly rather than watching the DOM.
 */
export function FaqAccordion(props: FaqAccordionProps) {
  const { items, iconSize = 24, disabled, className } = props;
  const reduceMotion = Boolean(useReducedMotionConfig());
  const controlled = props.value !== undefined;
  const [uncontrolled, setUncontrolled] = React.useState<string[]>(() => toOpenList(props.defaultValue));
  const open = controlled ? toOpenList(props.value) : uncontrolled;

  const list = items.map((item) => {
    const isOpen = open.includes(item.id);
    return (
      <AccordionPrimitive.Item
        key={item.id}
        value={item.id}
        disabled={item.disabled}
        className="border-b border-rule last:border-b-0"
      >
        <AccordionPrimitive.Header className="flex">
          <AccordionPrimitive.Trigger
            className={cn(
              "flex flex-1 cursor-pointer items-start justify-between gap-4 rounded-inset py-4 text-left",
              "font-heading text-lg leading-snug font-light tracking-[-0.03em] text-ink",
              "transition-opacity duration-200 hover:opacity-80 motion-reduce:transition-none",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            <span className="min-w-0">{item.question}</span>
            <span className="flex h-[1.375em] items-center">
              <PlusMinusIcon open={isOpen} size={iconSize} reduceMotion={reduceMotion} />
            </span>
          </AccordionPrimitive.Trigger>
        </AccordionPrimitive.Header>
        {/* Kept mounted so the height can animate both ways; `inert` keeps a closed answer out of reach. */}
        <AccordionPrimitive.Content forceMount inert={!isOpen} className="overflow-hidden">
          <motion.div
            initial={false}
            animate={
              isOpen
                ? { height: "auto", opacity: 1, filter: "blur(0px)" }
                : { height: 0, opacity: 0, filter: reduceMotion ? "blur(0px)" : "blur(4px)" }
            }
            transition={
              reduceMotion
                ? { duration: 0 }
                : {
                    height: { duration: 0.3, ease: "easeOut" },
                    opacity: { duration: 0.2, delay: 0.1 },
                    filter: { duration: 0.15, delay: 0.05 },
                  }
            }
            className="overflow-hidden"
          >
            <div className="pb-4 font-body text-base leading-relaxed font-light text-foreground">{item.answer}</div>
          </motion.div>
        </AccordionPrimitive.Content>
      </AccordionPrimitive.Item>
    );
  });

  const rootClass = cn("w-full", className);

  if (props.type === "multiple") {
    const { onValueChange } = props;
    return (
      <AccordionPrimitive.Root
        type="multiple"
        value={open}
        disabled={disabled}
        onValueChange={(next) => {
          if (!controlled) setUncontrolled(next);
          onValueChange?.(next);
        }}
        className={rootClass}
      >
        {list}
      </AccordionPrimitive.Root>
    );
  }

  const { collapsible = true, onValueChange } = props;
  return (
    <AccordionPrimitive.Root
      type="single"
      collapsible={collapsible}
      value={open[0] ?? ""}
      disabled={disabled}
      onValueChange={(next) => {
        if (!controlled) setUncontrolled(next ? [next] : []);
        onValueChange?.(next);
      }}
      className={rootClass}
    >
      {list}
    </AccordionPrimitive.Root>
  );
}

export default FaqAccordion;
