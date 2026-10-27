import { MessageCircleQuestionMark, Settings, User } from "lucide-react";

import type { AccountMenuEntry, AccountUser } from "./account-menu.tsx";

export const user: AccountUser = {
  name: "Amara Okafor",
  email: "amara.okafor@northwind.org",
  role: "Admin",
};

export const items: AccountMenuEntry[] = [
  { label: "Profile", icon: User, gesture: "bob" },
  { label: "Settings", icon: Settings, gesture: "spin" },
  { label: "Help", icon: MessageCircleQuestionMark, gesture: "wiggle" },
];

/** Stand-in: choosing Log out just closes the menu, so the trigger stays put. */
export const signOut = () => {};
