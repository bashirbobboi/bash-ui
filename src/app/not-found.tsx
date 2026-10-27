import Link from "next/link";
import { Ghost } from "@/components/site/ghost";

/** Unmatched URLs and every `notFound()`: the ghost is asleep, nobody's home. */
export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center">
      <Ghost state="sleeping" size={112} />
      <div className="space-y-2">
        <h1 className="text-[clamp(24px,4vw,30px)] leading-[1.2] font-medium tracking-[-0.005em] text-ink">Nothing here</h1>
        <p className="max-w-sm text-[14px] leading-[22px] text-dim">This page doesn&apos;t exist, or it moved.</p>
      </div>
      <Link
        href="/"
        className="site-raised inline-flex h-8 items-center rounded-full px-3 text-[13px] leading-[14px] font-medium text-ink transition-[background-color] hover:bg-paper-sunk"
      >
        Back to the introduction
      </Link>
    </div>
  );
}
