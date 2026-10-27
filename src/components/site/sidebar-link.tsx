"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SidebarLink({
  href,
  icon,
  exact = false,
  scroll,
  children,
}: {
  href: string;
  icon?: ReactNode;
  exact?: boolean;
  scroll?: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      scroll={scroll}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-9 shrink-0 items-center gap-2 rounded-full px-3 text-[13px] leading-5 font-medium whitespace-nowrap transition-[background-color,color,box-shadow] duration-150",
        // 16px in from the pill's left edge. The rail itself sits 8px left of the
        // column (see SiteSidebar), so the text still lines up with the group
        // labels while the selected pill gets room on both sides of it.
        "min-[900px]:h-10 min-[900px]:w-full min-[900px]:rounded-xl min-[900px]:pr-3 min-[900px]:pl-4",
        active ? "site-raised text-ink" : "text-foreground hover:bg-paper/60 max-[899px]:site-chip",
      )}
    >
      {icon}
      {/* Truncation clips overflow vertically too; keep room for descenders. */}
      <span className="min-w-0 truncate py-0.5">{children}</span>
    </Link>
  );
}
