import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type Neighbour = { href: string; title: string } | null;

/** Title block for a component or design system page: tile, name, one line, and the stepper. */
export function DetailHeader({
  icon,
  title,
  eyebrow,
  sub,
  prev,
  next,
}: {
  icon: ReactNode;
  title: string;
  eyebrow?: ReactNode;
  sub: string;
  prev: Neighbour;
  next: Neighbour;
}) {
  return (
    <header className="relative flex flex-col gap-3 pt-1">
      <div className="absolute top-0.5 right-0 hidden items-center gap-3.5 min-[900px]:flex">
        <StepLink to={prev} direction="prev" />
        <StepLink to={next} direction="next" />
      </div>
      {icon}
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-[clamp(28px,5vw,36px)] leading-[1.17] font-medium tracking-[-0.005em] text-ink">{title}</h1>
        {eyebrow ? <span className="text-[13px] text-faint">{eyebrow}</span> : null}
      </div>
      <p className="max-w-3xl text-[14px] leading-[22px] text-foreground">{sub}</p>
    </header>
  );
}

function StepLink({ to, direction }: { to: Neighbour; direction: "prev" | "next" }) {
  const Icon = direction === "prev" ? ArrowLeft : ArrowRight;
  if (!to) {
    return (
      <span className="site-chip grid size-9 place-items-center rounded-full text-ink opacity-35">
        <Icon className="size-4" />
      </span>
    );
  }
  return (
    <Link
      href={to.href}
      aria-label={`${direction === "prev" ? "Previous" : "Next"}: ${to.title}`}
      title={to.title}
      className="site-chip grid size-9 place-items-center rounded-full text-ink"
    >
      <Icon className="size-4" />
    </Link>
  );
}

/** A titled group inside a panel: "Installation", "Props". */
export function PanelGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2.5">
      <h2 className="px-1 text-[13px] leading-4 font-medium text-dim">{title}</h2>
      {children}
    </section>
  );
}
