import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  ChartSpline,
  Gauge,
  Layers,
  Images,
  ListTodo,
  MessageSquareHeart,
  MousePointerClick,
  PanelsTopLeft,
  TextCursorInput,
  Type,
  type LucideIcon,
} from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import type { ItemSource, ShippedFile } from "@/lib/prompts";
import { REGISTRY_CONFIG, installCommand } from "@/lib/site";
import { ITEMS } from "@/registry/items";
import type { ItemCategory, ItemMeta } from "@/registry/types";
import { THEMES } from "@/themes";
import { CategoryView, type CategoryItem } from "./category-view";
import { CodeBlock, CommandLine } from "./code-block";
import { DetailHeader, PanelGroup } from "./detail";

const CATEGORY_ICONS: Record<ItemCategory, LucideIcon> = {
  buttons: MousePointerClick,
  navigation: PanelsTopLeft,
  inputs: TextCursorInput,
  charts: ChartSpline,
  "data-display": Gauge,
  media: Images,
  lists: ListTodo,
  feedback: MessageSquareHeart,
  overlays: Layers,
  text: Type,
};

function themeLabel(slug: string) {
  const theme = THEMES.find((candidate) => candidate.slug === slug);
  return theme ? (theme.project === "bash-ui" ? theme.name : theme.project) : slug;
}

function importPathFor(meta: ItemMeta) {
  const base = path.basename(meta.files[0], ".tsx");
  return `@/components/${meta.type === "registry:ui" ? "ui/" : ""}${base}`;
}

async function readSource(file: string): Promise<string> {
  "use cache";
  return readFile(path.join(process.cwd(), file), "utf8");
}

function shippedPath(meta: ItemMeta, file: string) {
  return `components/${meta.type === "registry:ui" ? "ui/" : ""}${path.basename(file)}`;
}

const SIBLING = /(["'])\.\.\/([a-z0-9-]+)\/([a-z0-9-]+)\1/g;

/**
 * An item's files as they land in a consuming project: a sibling item's
 * relative import pointed at its `@/components` alias, as the registry build's
 * rewrite-imports step does.
 */
async function shippedFiles(meta: ItemMeta): Promise<ShippedFile[]> {
  return Promise.all(
    meta.files.map(async (file) => ({
      path: shippedPath(meta, file),
      content: (await readSource(file)).replace(SIBLING, (match, quote: string, sibling: string, base: string) => {
        const type = ITEMS.find((item) => item.meta.name === sibling)?.meta.type;
        return type ? `${quote}@/components/${type === "registry:ui" ? "ui/" : ""}${base}${quote}` : match;
      }),
    })),
  );
}

/** Everything a browser builder needs pasted in to add `meta`: its files, its bash-ui dependencies' files, and npm packages. */
async function itemSource(meta: ItemMeta): Promise<ItemSource> {
  const deps: ItemMeta[] = [];
  const queue = [...(meta.registryDependencies ?? [])];
  while (queue.length > 0) {
    const name = queue.shift();
    const dep = ITEMS.find((item) => item.meta.name === name)?.meta;
    if (!dep || dep === meta || deps.includes(dep)) continue;
    deps.push(dep);
    queue.push(...(dep.registryDependencies ?? []));
  }
  return {
    files: await shippedFiles(meta),
    deps: (await Promise.all(deps.map(shippedFiles))).flat(),
    packages: [...new Set([meta, ...deps].flatMap((item) => item.dependencies ?? []))],
  };
}

/** Categories that have members, in sidebar order: what the prev/next arrows walk. */
function liveCategories() {
  return CATEGORIES.filter((category) => ITEMS.some((item) => item.meta.category === category.slug));
}

/**
 * The page for one category: every member as a tile, a playground focused on
 * `focus`, and each member's install steps for the Install & Usage tab.
 */
export async function CategoryPage({ category, focus }: { category: ItemCategory; focus?: string }) {
  const categories = liveCategories();
  const index = categories.findIndex((candidate) => candidate.slug === category);
  const info = categories[index];
  const members = ITEMS.filter((item) => item.meta.category === category).map((item) => item.meta);
  const neighbour = (i: number) => {
    const target = categories[i];
    if (!target) return null;
    const first = ITEMS.find((item) => item.meta.category === target.slug);
    return first ? { href: `/components/${first.meta.name}`, title: target.label } : null;
  };

  const items: CategoryItem[] = members.map((meta) => ({
    name: meta.name,
    title: meta.title,
    home: THEMES.find((theme) => theme.project === meta.origin.project)?.slug ?? THEMES[0].slug,
    importPath: importPathFor(meta),
  }));

  const install: Record<string, React.ReactNode> = {};
  const sources: Record<string, ItemSource> = {};
  for (const meta of members) {
    install[meta.name] = await InstallPanel({ meta });
    sources[meta.name] = await itemSource(meta);
  }

  const Icon = CATEGORY_ICONS[category];

  return (
    <div className="space-y-[21px]">
      <DetailHeader
        icon={
          <span className="site-tile grid size-[46px] place-items-center rounded-xl text-ink" aria-hidden="true">
            <Icon className="size-5" strokeWidth={1.75} />
          </span>
        }
        title={info.label}
        sub={info.sub}
        prev={neighbour(index - 1)}
        next={neighbour(index + 1)}
      />
      <CategoryView
        items={items}
        initialFocus={focus ?? items[0].name}
        reveal={focus}
        themes={THEMES.map((theme) => ({ slug: theme.slug, label: themeLabel(theme.slug) }))}
        sources={sources}
        install={install}
      />
    </div>
  );
}

async function InstallPanel({ meta }: { meta: ItemMeta }) {
  const sources = await Promise.all(meta.files.map(async (file) => ({ file, code: await readSource(file) })));

  return (
    <>
      <PanelGroup title="Installation">
        <div className="space-y-2">
          <CommandLine command={installCommand(meta.name)} />
          <p className="px-1 text-[12.5px] leading-5 text-dim">
            First time in a project? Register the namespace in <code className="font-mono text-ink">components.json</code>:
          </p>
          <CodeBlock code={REGISTRY_CONFIG} />
        </div>
      </PanelGroup>

      <PanelGroup title="What it is">
        <div className="space-y-2 rounded-xl bg-card px-4 py-3.5 text-[14px] leading-[22px] text-foreground">
          <p>{meta.description}</p>
          <p className="text-dim">{meta.whenToUse}</p>
        </div>
      </PanelGroup>

      {meta.props.length > 0 ? (
        <PanelGroup title="Props">
          <div className="divide-y divide-rule-soft overflow-hidden rounded-xl bg-card">
            {meta.props.map((prop) => (
              <div key={prop.name} className="grid gap-1 px-4 py-3 sm:grid-cols-[12rem_1fr] sm:gap-4">
                <div className="min-w-0 space-y-0.5">
                  <code className="block font-mono text-[12.5px] break-words text-ink">{prop.name}</code>
                  <code className="block font-mono text-[11.5px] break-words text-faint">{prop.type}</code>
                </div>
                <p className="text-[13px] leading-5 text-dim">{prop.description}</p>
              </div>
            ))}
          </div>
        </PanelGroup>
      ) : null}

      <PanelGroup title="Source">
        <div className="space-y-2">
          {sources.map((source) => (
            <CodeBlock key={source.file} label={path.basename(source.file)} code={source.code} />
          ))}
        </div>
      </PanelGroup>

      <PanelGroup title="Origin">
        <div className="space-y-1.5 rounded-xl bg-card px-4 py-3.5 text-[13px] leading-5 text-foreground">
          <p>
            First built for <span className="text-ink">{meta.origin.project}</span>{" "}
            <code className="font-mono text-[11.5px] break-all text-faint">{meta.origin.path}</code>
          </p>
          {meta.credits.length === 0 ? (
            <p className="text-dim">Original work.</p>
          ) : (
            meta.credits.map((credit) => (
              <p key={credit.name} className="text-dim">
                Adapted from{" "}
                {credit.url ? (
                  <a href={credit.url} target="_blank" rel="noreferrer" className="text-lead hover:underline">
                    {credit.name}
                  </a>
                ) : (
                  credit.name
                )}
                {credit.license ? ` · ${credit.license}` : null}
              </p>
            ))
          )}
        </div>
      </PanelGroup>
    </>
  );
}
