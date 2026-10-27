"use client";

import { useSyncExternalStore } from "react";
import { BotAvatar, type BotAvatarProps } from "bot-avatars";

type Outfit = Pick<BotAvatarProps, "color" | "face" | "hat" | "accessoryColor">;

export const PARTY_HAT: Outfit = { hat: "party", accessoryColor: "#ff4fa3" };

// Costume colours, not theme colours: the ghost looks the same in every system.
const OUTFITS = {
  birthday: PARTY_HAT,
  halloween: { color: "#ff8a1f", face: "mouth" },
  winter: { hat: "beanie", accessoryColor: "#d7263d" },
  newYear: PARTY_HAT,
} satisfies Record<string, Outfit>;

type Occasion = keyof typeof OUTFITS;

function occasion(date: Date): Occasion | null {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  if (month === 10 && day === 21) return "birthday"; // the first commit, 21 October 2026
  if (month === 10 && day >= 24) return "halloween"; // the week up to it, in a pumpkin costume
  if ((month === 12 && day === 31) || (month === 1 && day === 1)) return "newYear";
  if (month === 12) return "winter";
  return null;
}

// The date is the visitor's own, so it is only read in the browser: the
// prerendered page has no date in it, and the outfit goes on at hydration.
const subscribe = () => () => {};

/**
 * bash-ui's mascot: the ghost from Jakub Antalik's bot-avatars (MIT,
 * libraries.dev/bots). Site furniture, never part of a registry item, so it
 * keeps its own white in every design system, and dresses for the date.
 * Decorative wherever it sits: the words beside it carry the meaning. Props
 * win over the outfit.
 */
export function Ghost(props: Omit<BotAvatarProps, "type">) {
  const today = useSyncExternalStore(subscribe, () => occasion(new Date()), () => null);
  return <BotAvatar type="ghost" aria-hidden="true" {...(today ? OUTFITS[today] : null)} {...props} />;
}
