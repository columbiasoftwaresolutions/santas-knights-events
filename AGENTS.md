<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Working in this repo

- Run `pnpm check` before you finish. It runs oxlint (including the `@shadcn/lint` design-system rules), the format check, the type-check, Effect diagnostics and the tests. Fix every error.
- Style with theme tokens and the components in `src/components/ui`. Do not restyle a component through `className`, use raw colors such as `bg-pink-500`, or use arbitrary values such as `p-[13px]`. If the design needs something new, add a variant or a named `@utility` in `src/app/globals.css` instead.
- Commit in small pieces, one logical change each.

## Tests

Test intended behavior and nothing else. A test should fail only when something a visitor, a source or the database
relies on has broken, and should survive a refactor, a copy edit or a change to the demo data.

- Assert outcomes and rules (a free listing needs matching evidence, a refused request stops the scan), not exact
  strings, call order, request options or internal shape.
- Build the data a test needs in the test (`src/lib/listings/test-support.ts`). Never depend on the demo data in
  `sample.ts` for anything except checking that the demo data itself is valid.
- Pin a regression with one test at the layer where it can happen. Do not repeat a rule at every layer.
- No sleeping, real network or wall-clock dependence. Inject fetch and use fake timers.
- Fixtures are trimmed excerpts of real pages. Keep them small, and assert on what matters in them.
- A test that has to change on every unrelated edit is a bug in the test. Delete or rewrite it.
