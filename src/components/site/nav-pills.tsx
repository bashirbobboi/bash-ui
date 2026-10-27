"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/components", label: "Components", match: ["/components"] },
  { href: "/systems", label: "Design systems", match: ["/systems"] },
  { href: "/how-to-use", label: "How to use", match: ["/how-to-use"] },
];

export function NavPills() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-1 sm:flex">
      {NAV.map((item) => {
        const active = item.match.some((prefix) => pathname.startsWith(prefix));
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex h-9 items-center rounded-full px-3.5 text-[13px] leading-4 font-medium whitespace-nowrap transition-colors",
              active ? "bg-paper text-ink" : "text-dim hover:bg-paper hover:text-ink",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
