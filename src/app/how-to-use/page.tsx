import type { Metadata } from "next";
import Link from "next/link";
import { AgentNote } from "@/components/site/agent-note";
import { PageTitle } from "@/components/site/cards";
import { CodeBlock, CommandLine } from "@/components/site/code-block";
import { PanelGroup } from "@/components/site/detail";
import { REGISTRY_CONFIG, REGISTRY_FALLBACK, SITE_URL, installCommand, themeItemName } from "@/lib/site";

export const metadata: Metadata = { title: "How to use" };

export default function HowToUse() {
  return (
    <div className="space-y-8">
      <PageTitle
        title="How to use"
        sub="Everything here installs with the shadcn CLI into any React project with Tailwind v4. Start with a design system, then add components as you need them."
      />

      <div className="site-stage space-y-6 rounded-2xl p-3 sm:p-4">
        <PanelGroup title="1 · Pick a design system">
          <CommandLine command={installCommand(themeItemName("180connect"))} />
          <p className="px-1 text-[13px] leading-5 text-dim">
            It writes every colour into <code className="font-mono text-ink">:root</code> and{" "}
            <code className="font-mono text-ink">.dark</code>. Load the fonts it names with{" "}
            <code className="font-mono text-ink">next/font</code>; each system&apos;s page lists them.{" "}
            <Link href="/systems" className="text-lead hover:underline">
              See all systems
            </Link>
            .
          </p>
        </PanelGroup>

        <PanelGroup title="2 · Add components">
          <CommandLine command={installCommand("score-gauge")} />
          <p className="px-1 text-[13px] leading-5 text-dim">
            The source is copied into your project. It is yours to change from then on.
          </p>
        </PanelGroup>

        <PanelGroup title="On an older shadcn CLI">
          <p className="px-1 text-[13px] leading-5 text-dim">{REGISTRY_FALLBACK}</p>
          <CodeBlock code={REGISTRY_CONFIG} label="components.json" />
        </PanelGroup>

        <PanelGroup title="With an agent">
          <AgentNote>
            Every component page has a <span className="text-ink">Copy prompt</span> button: paste it into Claude Code
            or any coding agent and it installs and uses the component. For a whole project, point the agent at{" "}
            <a href="/llms.txt" className="text-lead hover:underline">
              {SITE_URL.replace(/^https?:\/\//, "")}/llms.txt
            </a>
            , which lists every system&apos;s rules and every component with when to use it.
          </AgentNote>
        </PanelGroup>
      </div>
    </div>
  );
}
