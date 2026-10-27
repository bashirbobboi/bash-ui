"use client";

import { useEffect, useState } from "react";
import { Ghost, PARTY_HAT } from "./ghost";

const DOZE_AFTER = 30_000;
const ACTIVITY = ["pointermove", "pointerdown", "keydown", "wheel", "scroll", "touchstart"] as const;

/**
 * The greeter on the introduction. It nods off when the page has been left
 * alone for half a minute and wakes at the first sign of the visitor. Every
 * fifth click puts a party hat on, or takes it off.
 */
export function IntroGhost({ className }: { className?: string }) {
  const [asleep, setAsleep] = useState(false);
  const [clicks, setClicks] = useState(0);

  useEffect(() => {
    let timer = setTimeout(() => setAsleep(true), DOZE_AFTER);
    const wake = () => {
      setAsleep(false);
      clearTimeout(timer);
      timer = setTimeout(() => setAsleep(true), DOZE_AFTER);
    };
    for (const type of ACTIVITY) window.addEventListener(type, wake, { passive: true });
    return () => {
      clearTimeout(timer);
      for (const type of ACTIVITY) window.removeEventListener(type, wake);
    };
  }, []);

  const partying = Math.floor(clicks / 5) % 2 === 1;

  return (
    <Ghost
      size={80}
      state={asleep ? "sleeping" : "default"}
      onClick={() => setClicks((count) => count + 1)}
      className={className}
      {...(partying ? PARTY_HAT : null)}
    />
  );
}
