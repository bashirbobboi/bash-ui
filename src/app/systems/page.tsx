import type { Metadata } from "next";
import Link from "next/link";
import { Blend } from "lucide-react";
import { PageTitle, SystemCard } from "@/components/site/cards";
import { ItemIcon } from "@/components/site/item-icon";
import { THEMES } from "@/themes";

export const metadata: Metadata = { title: "Design systems" };

export default function SystemsPage() {
  return (
    <div className="space-y-8">
      <PageTitle
        title="Design systems"
        sub="One per project. Each is a value for every colour in the shared contract, light and dark, plus the rules that make it that system and not another."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {THEMES.map((theme) => (
          <SystemCard key={theme.slug} theme={theme} />
        ))}
        <Link
          href="/systems/mix"
          className="flex flex-col gap-3 rounded-2xl border border-dashed border-rule p-4 transition-colors duration-150 hover:bg-paper/60 focus-visible:outline-2 focus-visible:outline-ring"
        >
          <ItemIcon name="playground" icon={Blend} />
          <div className="space-y-1">
            <h3 className="text-[14px] leading-5 font-medium text-ink">Playground</h3>
            <p className="text-[13px] leading-5 text-dim">
              Mix your own: start from one system, borrow colours, type and shape from the others, and copy the result as a theme file.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
