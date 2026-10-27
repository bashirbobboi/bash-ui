import Link from "next/link";
import { BrandMark } from "./brand-mark";
import { ModeToggle } from "./mode-toggle";
import { NavPills } from "./nav-pills";

/**
 * Pinned to the top at every scroll position, full width, so content passes
 * under it rather than past it. Its height is `--header-h`, which the sidebar
 * reads to pin itself directly beneath.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-[color-mix(in_srgb,var(--site-bg)_88%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex h-(--header-h) w-full max-w-[1240px] items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-6">
          <Link href="/" className="flex shrink-0 items-center gap-2 text-[15px] leading-none font-medium tracking-[-0.01em]">
            <BrandMark />
            <span>
              <span className="text-ink">bash</span>
              <span className="text-dim">-ui</span>
            </span>
          </Link>
          <NavPills />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
