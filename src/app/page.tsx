import Link from "next/link";
import { PageTitle } from "@/components/site/cards";
import { PanelGroup } from "@/components/site/detail";
import { IntroGhost } from "@/components/site/intro-ghost";

/**
 * The front page says what this is and nothing else. The galleries live on
 * their own pages.
 */
export default function Introduction() {
  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-6">
        <PageTitle
          title="Introduction"
          sub="This is a collection of the design systems and components I've thoughtfully crafted for projects. Explore, adapt, and use them however you see fit."
        />
        <IntroGhost className="shrink-0 max-sm:hidden" />
      </div>

      <div className="site-stage space-y-6 rounded-2xl p-3 sm:p-4">
        <PanelGroup title="Why I built this">
          <div className="space-y-3 rounded-xl bg-card px-4 py-3.5">
            <p className="text-[14px] leading-[22px] text-foreground">
              I start each project with a blank canvas. Finding the right direction takes time: gathering inspiration,
              trying ideas, and working through the colours, typography, and details until they feel right together.
            </p>
            <p className="text-[14px] leading-[22px] text-foreground">
              I wanted to keep a record of that work, somewhere to revisit those decisions and draw inspiration from
              what I&apos;d already made. That&apos;s how this collection started.
            </p>
          </div>
        </PanelGroup>
        <PanelGroup title="What's here">
          <div className="grid gap-2 sm:grid-cols-2">
            <Pointer
              href="/systems"
              title="Design systems"
              body="Colour palettes, typography, and shape, carefully considered together to give each project its own visual identity."
            />
            <Pointer
              href="/collections/buttons"
              title="Components"
              body="Reusable buttons, navigation, inputs, and charts. Explore each one in a playground and adjust it to suit your project."
            />
          </div>
        </PanelGroup>

        <PanelGroup title="Using the components">
          <Prose>
            Install a component into your project, connect your data, and edit the source to suit what you&apos;re
            building. The{" "}
            <Link href="/how-to-use" className="text-lead hover:underline">
              how to use guide
            </Link>
            {" "}covers installation and working with coding agents.
          </Prose>
        </PanelGroup>
      </div>
    </div>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl bg-card px-4 py-3.5 text-[14px] leading-[22px] text-foreground">{children}</p>;
}

function Pointer({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-1 rounded-xl bg-card px-4 py-3.5 transition-colors hover:bg-paper"
    >
      <span className="text-[14px] leading-5 font-medium text-ink">{title}</span>
      <span className="text-[13px] leading-5 text-dim">{body}</span>
    </Link>
  );
}
