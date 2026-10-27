import type { MenuItem } from "./expanding-menu";

// Ledge's shorter tenant navigation, from src/app/tenant/layout.tsx.
export const items: MenuItem[] = [
  { label: "My tenancies", href: "/tenant" },
  { label: "Payments", href: "/tenant/payments" },
  { label: "Messages", href: "/tenant/messages" },
  { label: "Account", href: "/tenant/account" },
  { label: "Support", href: "/tenant/support" },
];
