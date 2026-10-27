/** Where the site is deployed. The registry's install URLs are built from it. */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bash-ui-registry.vercel.app";

/** The shadcn namespace a consuming project registers this site under. */
export const NAMESPACE = "@bash";

/**
 * The namespace is in shadcn's registry index, so current CLIs resolve it with
 * no setup. Only CLIs from before the index need it registered by hand.
 */
export const REGISTRY_CONFIG = `"registries": {\n  "${NAMESPACE}": "${SITE_URL}/r/{name}.json"\n}`;

export const REGISTRY_FALLBACK = `If the CLI says "${NAMESPACE}" is an unknown registry (a shadcn version from before the registry index), add this to components.json and run it again:`;

export function installCommand(...names: string[]): string {
  return `npx shadcn@latest add ${names.map((name) => `${NAMESPACE}/${name}`).join(" ")}`;
}

export function themeItemName(slug: string): string {
  return `theme-${slug}`;
}

/** Where to find the person behind the site, shown in the header. */
export const AUTHOR_LINKS = {
  github: "https://github.com/bashirbobboi",
  x: "https://x.com/bashirbobboi",
  portfolio: "https://bashir.is-a.dev",
} as const;
