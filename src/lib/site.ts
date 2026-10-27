/** Where the site is deployed. The registry's install URLs are built from it. */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bash-ui-registry.vercel.app";

/** The shadcn namespace a consuming project registers this site under. */
export const NAMESPACE = "@bash";

export const REGISTRY_CONFIG = `"registries": {\n  "${NAMESPACE}": "${SITE_URL}/r/{name}.json"\n}`;

export function installCommand(...names: string[]): string {
  return `npx shadcn@latest add ${names.map((name) => `${NAMESPACE}/${name}`).join(" ")}`;
}

export function themeItemName(slug: string): string {
  return `theme-${slug}`;
}
