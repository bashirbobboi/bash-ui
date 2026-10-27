<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# bash-ui

A personal component registry and design-system gallery. Two things live here:

1. **Design systems** (`src/themes/`): one file per project, each a value for
   every token in the contract (`src/themes/contract.ts`), light and dark, plus
   the rules that make it that system.
2. **Components** (`registry/items/<name>/`): pieces worth reusing, rewritten so
   they run in any theme. Consumers install them with
   `npx shadcn add @bash/<name>`.

## Writing a registry item

Each item is a folder:

```
registry/items/<name>/
  <name>.tsx      the component that ships (more files allowed; list them in meta)
  preview.tsx     "use client"; default export: the component ONCE, at rest, nothing around it
  playground.tsx  "use client"; export const playground: PlaygroundSpec (3–6 controls, render, codeProps)
  fixtures.ts     optional fake data shared by preview and playground (not shipped)
  meta.ts         export const meta: ItemMeta  (see registry/types.ts), including its category
```

Then add it to `registry/items/index.ts`.

The gallery shows every component once, alone, on a plain tile; variety lives in
the playground. A preview never carries headings, captions or a fake page around
the component. Every playground control's `name` must be a real prop, because the
code panel prints `name={value}` from it.

Rules for the shipped files:

- **Tokens only.** Colours, radii and fonts come from the contract: `bg-card`,
  `border-rule`, `text-ink`, `text-dim`, `text-faint`, `bg-paper`, `text-lead`,
  `text-go`/`hold`/`stop` and their `-wash` fills, `rounded-panel`,
  `rounded-inset`, `font-body`, `font-mono`. No hex, no `rgb()`, no Tailwind
  palette (`zinc-500`, `emerald-600`), no `text-white` on a fill (use
  `text-on-solid`). If a component needs a colour the contract lacks, add the
  token to the contract and to every theme — do not hard-code it.
- **Imports.** Only npm packages and `@/lib/utils` (`cn`). Another bash-ui item
  is imported as `@/components/ui/<name>` (primitive) or
  `@/components/<name>` (widget/pattern) and named in `registryDependencies`.
  No project code: no Supabase, no server actions, no app routes or types.
- **Data in, events out.** Anything that came from a database becomes a prop.
  Anything that wrote to one becomes a callback (`onSubmit`, `onChange`).
- **Motion** uses `motion/react` and honours reduced motion via
  `useReducedMotionConfig()`.
- Credit every outside source in `meta.credits` with its licence, or
  "unknown" when the source does not state one. Third-party images, logos and
  media go in `NOTICE`, not under the MIT licence.

## Commands

```bash
npm run dev            # showcase on :3100
npm run lint
npx tsc --noEmit
npm run check          # contract: every theme has every token; every item is listed
npm run registry:build # registry.json + public/r/*.json
```
