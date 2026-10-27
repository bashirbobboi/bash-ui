import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CodeBlock, CommandLine } from "@/components/site/code-block";
import { SystemCopyMenu } from "@/components/site/copy-menu";
import { DetailHeader, PanelGroup } from "@/components/site/detail";
import { Ghost } from "@/components/site/ghost";
import { ProjectIdentity } from "@/components/site/project-identity";
import { SystemIcon } from "@/components/site/item-icon";
import { StudioComponents } from "@/components/site/studio-components";
import { TabbedPanels } from "@/components/site/tabbed-panels";
import { ThemeScene } from "@/components/site/theme-scene";
import { ThemeAccessibility } from "@/components/site/theme-accessibility";
import { Tile, TileGrid } from "@/components/site/tiles";
import { installCommand, themeItemName } from "@/lib/site";
import { ITEMS } from "@/registry/items";
import { THEMES, getTheme } from "@/themes";
import { TOKENS, TOKEN_GROUP_LABELS, type TokenGroup } from "@/themes/contract";
import type { Theme } from "@/themes/types";

// A slug not in the build waits for its full render instead of being sent the
// prerendered shell first, so an unknown one returns a 404, not a 200 that says
// "not found". It also means nothing on this route may render per request.
export const ensureStatic = "navigation";

export function generateStaticParams() {
  return THEMES.map((theme) => ({ slug: theme.slug }));
}

export async function generateMetadata({ params }: PageProps<"/systems/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const theme = getTheme(slug);
  return { title: theme ? `${theme.name} (${theme.project})` : "Design system" };
}

export default function Page({ params }: PageProps<"/systems/[slug]">) {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <SystemBody params={params} />
    </Suspense>
  );
}

const GROUPS = Object.keys(TOKEN_GROUP_LABELS) as TokenGroup[];

async function SystemBody({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const index = THEMES.findIndex((theme) => theme.slug === slug);
  if (index === -1) notFound();
  const theme = THEMES[index];
  const neighbour = (i: number) =>
    THEMES[i] ? { href: `/systems/${THEMES[i].slug}`, title: THEMES[i].name } : null;

  return (
    <div className="space-y-[21px]">
      <DetailHeader
        icon={<SystemIcon slug={theme.slug} size="lg" />}
        title={theme.name}
        eyebrow={<ProjectIdentity theme={theme} />}
        sub={theme.summary}
        prev={neighbour(index - 1)}
        next={neighbour(index + 1)}
      />
      <TabbedPanels
        label="View"
        actions={<SystemCopyMenu slug={theme.slug} />}
        panels={[
          { value: "overview", label: "Overview", content: <Overview theme={theme} /> },
          { value: "components", label: "Components", content: <Components theme={theme} /> },
          { value: "tokens", label: "Tokens", content: <Tokens theme={theme} /> },
          { value: "install", label: "Install", content: <Install theme={theme} /> },
        ]}
      />
    </div>
  );
}

function Overview({ theme }: { theme: Theme }) {
  return (
    <div className="space-y-3">
      <div id="system-scene">
        <ThemeScene theme={{ slug: theme.slug, fonts: theme.fonts, radius: theme.radius, scene: theme.scene }} />
      </div>

      <div className="site-stage space-y-6 rounded-2xl p-3 sm:p-4">
        <PanelGroup title="Rules">
          <ol className="grid gap-2 md:grid-cols-2">
            {theme.rules.map((rule, i) => (
              <li key={rule.title} className="flex gap-3 rounded-xl bg-card px-4 py-3.5">
                <span className="w-5 shrink-0 font-mono text-[12px] leading-5 text-faint tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="space-y-1">
                  <h3 className="text-[13.5px] leading-5 font-medium text-ink">{rule.title}</h3>
                  <p className="text-[13px] leading-5 text-dim">{rule.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </PanelGroup>

        {theme.credits?.length ? (
          <PanelGroup title="Adapted from">
            <p className="rounded-xl bg-card px-4 py-3.5 text-[13px] leading-5 text-dim">
              {theme.credits.map((credit, index) => (
                <span key={credit.name}>
                  {index > 0 ? " · " : null}
                  <a href={credit.url} target="_blank" rel="noreferrer" className="text-lead hover:underline">
                    {credit.name}
                  </a>
                  {credit.license ? ` · ${credit.license}` : null}
                </span>
              ))}
            </p>
          </PanelGroup>
        ) : null}

        <ThemeAccessibility theme={theme} />
      </div>
    </div>
  );
}

/** Show only components originating from this system's project. */
function Components({ theme }: { theme: Theme }) {
  if (theme.slug === "studio") return <StudioComponents theme={theme} />;

  const items = ITEMS.filter(({ meta }) => meta.origin.project === theme.project);

  if (items.length === 0) {
    return (
      <div className="site-stage flex flex-col items-center rounded-2xl px-6 py-12 text-center">
        <Ghost size={64} className="mb-4" />
        <p className="text-[14px] font-medium text-ink">No components added yet</p>
        <p className="mt-2 text-[13px] leading-5 text-dim">
          Components extracted from {theme.project} will appear here once added.
        </p>
      </div>
    );
  }

  return (
    <TileGrid>
      {items.map(({ meta, Preview }) => (
        <Tile
          key={meta.name}
          theme={theme.slug}
          label={meta.title}
          replay={meta.previewReplay}
          grow={meta.previewGrow}
          className={meta.previewWidth === "full" ? "md:col-span-2" : undefined}
          corner={
            <Link
              href={`/components/${meta.name}`}
              className="site-chip inline-flex h-7 items-center rounded-full px-2.5 text-[12px] font-medium text-ink"
            >
              Open
            </Link>
          }
        >
          <Preview />
        </Tile>
      ))}
    </TileGrid>
  );
}

function Tokens({ theme }: { theme: Theme }) {
  return (
    <div className="site-stage space-y-6 rounded-2xl p-3 sm:p-4">
      {GROUPS.map((group) => (
        <PanelGroup key={group} title={TOKEN_GROUP_LABELS[group]}>
          <div className="divide-y divide-rule-soft overflow-hidden rounded-xl bg-card">
            {TOKENS.filter((token) => token.group === group).map((token) => (
              <div
                key={token.name}
                className="grid grid-cols-[2rem_1fr] items-center gap-x-3 gap-y-0.5 px-3 py-2.5 sm:grid-cols-[2rem_10rem_1fr_auto]"
              >
                <span className="flex h-8 overflow-hidden rounded-lg shadow-[inset_0_0_0_1px_rgba(127,127,127,0.25)]">
                  <span data-theme={theme.slug} className="flex-1" style={{ background: `var(--${token.name})` }} />
                </span>
                <code className="font-mono text-[12.5px] text-ink">{token.name}</code>
                <span className="col-start-2 text-[13px] text-dim sm:col-start-auto">{token.role}</span>
                <span className="col-start-2 font-mono text-[11px] text-faint sm:col-start-auto">
                  {theme.light[token.name]} · {theme.dark[token.name]}
                </span>
              </div>
            ))}
          </div>
        </PanelGroup>
      ))}
    </div>
  );
}

function Install({ theme }: { theme: Theme }) {
  const fonts = [...new Set(Object.values(theme.fonts).map((font) => font.nextFont))].filter(
    (font): font is string => Boolean(font),
  );
  return (
    <div className="site-stage space-y-6 rounded-2xl p-3 sm:p-4">
      <PanelGroup title="Install the system">
        <CommandLine command={installCommand(themeItemName(theme.slug))} />
        <p className="px-1 text-[13px] leading-5 text-dim">
          Writes every colour into <code className="font-mono text-ink">:root</code> and{" "}
          <code className="font-mono text-ink">.dark</code>, plus the radius and font variables.
        </p>
      </PanelGroup>
      <PanelGroup title="Load the fonts">
        <CodeBlock code={fonts.join("\n")} label="next/font" />
      </PanelGroup>
    </div>
  );
}
