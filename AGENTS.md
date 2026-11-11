<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Working in this repo

- Run `pnpm check` before you finish. It runs oxlint (including the `@shadcn/lint` design-system rules), the format check, the type-check, Effect diagnostics and the tests. Fix every error.
- Style with theme tokens and the components in `src/components/ui`. Do not restyle a component through `className`, use raw colors such as `bg-pink-500`, or use arbitrary values such as `p-[13px]`. If the design needs something new, add a variant or a named `@utility` in `src/app/globals.css` instead.
- Commit in small pieces, one logical change each.
