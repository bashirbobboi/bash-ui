# bash-ui

My design systems and the components worth keeping from each project, in one
place. It is a showcase site and a [shadcn registry](https://ui.shadcn.com/docs/registry):
anything shown here can be installed into a new project with one command.

## What's in it

- **Design systems** (`src/themes/`): one per project. Each one is a value for
  every token in a shared contract (`src/themes/contract.ts`), in light and
  dark, plus the rules that make it that system.
- **Components** (`registry/items/`): written against the contract only, so
  each one renders in every design system. The gallery lets you switch between
  them on any component.
- **An index for agents** at `/llms.txt`: every system's rules and tokens, and
  every component with when to use it and its props. Point a coding agent at it
  when starting a project.

## Using it in a project

Add the namespace to the project's `components.json`:

```json
"registries": {
  "@bash": "https://bash-ui.vercel.app/r/{name}.json"
}
```

Then:

```bash
npx shadcn@latest add @bash/theme-180connect     # a design system
npx shadcn@latest add @bash/stick-progress-bar  # a component
```

## Working on it

```bash
npm install
npm run dev              # http://localhost:3100
npm run check            # contract: themes complete, items listed, no raw colours
npm run registry:build   # registry.json + public/r/*.json
```

Adding a design system: copy `src/themes/neutral.ts`, fill every token, add it
to `src/themes/index.ts`. Adding a component: see `AGENTS.md`.

## Credits

The site's own look (the "Studio" design system, and the gallery chrome in
`src/components/site/` and `globals.css`) is adapted from
[Libraries.dev](https://github.com/Jakubantalik/Libraries.dev) by Jakub
Antalik, MIT. Its Saans display face is a commercial font and is not used here;
the site uses Inter and Roboto Mono instead. The ghost that turns up around
the site is the `ghost` from his [bot-avatars](https://libraries.dev/bots)
package, also MIT. The light/dark switch in the header is adapted from
[Blind Pull Toggle](https://21st.dev/@aicanvas/components/blind-pull-toggle)
by @aicanvas on 21st.dev, MIT.

The agent logos in the Copy prompt menu (`public/agents/`) belong to their
companies. The Claude, ChatGPT, Cursor and Replit renderings are from
[Icons8](https://icons8.com).

Some components started from other people's work. Each one's page, and its
`meta.ts`, names the source and licence.

## Licence

Code is [MIT](LICENSE). Images, logos, screenshots and media in `public/` are
not covered by it and belong to their owners; see [NOTICE](NOTICE).
