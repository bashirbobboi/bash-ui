"use client";

import { AnimatePresence, motion, useReducedMotionConfig } from "motion/react";
import { useState, type ReactNode } from "react";
import { PillTabs } from "./pill-tabs";

/** Pill tabs over server-rendered panels, with the same soft swap as a component page. */
export function TabbedPanels({
  panels,
  actions,
  label,
}: {
  panels: { value: string; label: string; content: ReactNode }[];
  actions?: ReactNode;
  label: string;
}) {
  const [view, setView] = useState(panels[0]?.value ?? "");
  const reduce = useReducedMotionConfig();
  const active = panels.find((panel) => panel.value === view) ?? panels[0];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <PillTabs
          label={label}
          value={view}
          onChange={setView}
          className="-ml-[3px]"
          tabs={panels.map(({ value, label: tabLabel }) => ({ value, label: tabLabel }))}
        />
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={active?.value}
          initial={reduce ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: -4 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          {active?.content}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
