/**
 * Runs after `shadcn build`. Inside this repo an item imports a sibling item by
 * relative path (`../account-menu/account-menu`), because that is what resolves
 * here. In a consuming project the sibling lands at `@/components/<file>` (or
 * `@/components/ui/<file>` for a primitive), so the built JSON is rewritten to
 * those aliases. The source files are never touched.
 *
 * It also hides `asChild` from the shadcn CLI. In a Base UI project (style
 * `base-*`, the CLI's default) the CLI rewrites every JSX `asChild` attribute
 * into Base UI's `render` prop, which breaks these items because they import
 * Radix directly. A spread, `{...{ asChild: true }}`, means the same to Radix
 * and is left alone.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ROOT, loadMetas } from "./registry-source.ts";

const metas = await loadMetas();
const typeOf = new Map(metas.map((meta) => [meta.name, meta.type]));
const SIBLING = /(["'])\.\.\/([a-z0-9-]+)\/([a-z0-9-]+)\1/g;
const AS_CHILD = /(\s)asChild(?=\s|>)/g;

let rewritten = 0;
let hidden = 0;
for (const meta of metas) {
  const file = path.join(ROOT, "public/r", `${meta.name}.json`);
  const item = JSON.parse(await readFile(file, "utf8")) as { files: { content?: string }[] };
  for (const entry of item.files) {
    if (!entry.content) continue;
    entry.content = entry.content.replace(SIBLING, (match, quote: string, sibling: string, base: string) => {
      const type = typeOf.get(sibling);
      if (!type) throw new Error(`${meta.name} imports ../${sibling}/${base}, which is not a registry item`);
      if (!meta.registryDependencies?.includes(sibling)) {
        throw new Error(`${meta.name} imports ${sibling} but does not list it in registryDependencies`);
      }
      rewritten += 1;
      return `${quote}@/components/${type === "registry:ui" ? "ui/" : ""}${base}${quote}`;
    });
    entry.content = entry.content.replace(AS_CHILD, (match, space: string) => {
      hidden += 1;
      return `${space}{...{ asChild: true }}`;
    });
  }
  await writeFile(file, `${JSON.stringify(item, null, 2)}\n`);
}
console.log(`rewrote ${rewritten} cross-item import${rewritten === 1 ? "" : "s"}, hid ${hidden} asChild`);
