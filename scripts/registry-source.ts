/**
 * Loads every item's meta.ts straight from disk. Scripts run on plain Node
 * (type stripping), which cannot load the .tsx demos that registry/items/index.ts
 * pulls in, so they read the metas directly instead.
 */
import { readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { ItemMeta } from "../registry/types.ts";

export const ROOT = path.resolve(import.meta.dirname, "..");
export const ITEMS_DIR = path.join(ROOT, "registry/items");

export async function itemFolders(): Promise<string[]> {
  const entries = await readdir(ITEMS_DIR, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
}

export async function loadMetas(): Promise<ItemMeta[]> {
  const metas: ItemMeta[] = [];
  for (const folder of await itemFolders()) {
    const mod = (await import(pathToFileURL(path.join(ITEMS_DIR, folder, "meta.ts")).href)) as {
      meta: ItemMeta;
    };
    metas.push(mod.meta);
  }
  return metas;
}
