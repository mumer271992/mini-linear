<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Mini Linear — agent guide

A lightweight issue tracker: organizations → projects → tasks, with
email invites and role-based permissions. This file is the shared instruction
set for every AI coding agent working in this repo (`CLAUDE.md` imports it).

## Working agreement

These rules come first. They keep the human in control of every change.

- **Confirm before changing code.** Propose the change (files, approach,
  trade-offs) and wait for approval. Work one step at a time, not everything
  at once.
- **Never run migrations, seeds, or anything that touches a database.** That
  includes `npm run migrate`, `migrate:prod`, `seed`, `seed:prod`, and raw
  `psql`/`prisma` commands against a real DB. Give the human the exact command
  and let them run it.
- **Never commit, push, or open PRs unless asked.** The human commits.
- **Report results honestly.** Say what was verified (tests, typecheck, lint)
  and what wasn't (e.g. not tried in the browser).
- When a review raises findings, triage them (fix / optional / skip, with a
  reason) instead of applying all of them.

## Commands

| Task | Command |
|---|---|
| Dev server | `npm run dev` |
| Unit/component tests | `npm run test` (Vitest + Testing Library, jsdom) |
| Typecheck | `npm run typecheck` |
| Lint | `npm run lint` |
| Build | `npm run build` |

Before reporting a change as done, run `test`, `typecheck` and `lint`. CI
(`.github/workflows/preview.yml`) runs the same three on every PR to `main`.

Database commands (`migrate`, `seed`, and their `:prod` variants) are
human-only — see the working agreement. `scripts/migrate.sh` is a custom
workaround for `prisma migrate` hanging against Supabase's pooler: it diffs
`schema.prisma` against a snapshot, applies the SQL with `psql`, and records it
in `_prisma_migrations`.

## Stack

Next.js 16 (App Router, Server Components, Server Actions) · React 19 ·
TypeScript · Prisma 6 with the `pg` adapter on Supabase Postgres · Tailwind CSS
4 · react-hook-form + zod · Resend + react-email · Sonner (toasts) ·
Heroicons · Vitest. Deployed on Vercel.

## Architecture

```
src/
  app/                 routes: (marketing), (auth), (app)/dashboard/[orgSlug]/...
  components/          feature components; components/ui/ holds primitives
  server/db/           data access -- the only place that talks to Prisma
  server/actions/      "use server" actions -- auth, validation, then server/db
  lib/                 pure helpers safe to import anywhere (no server-only code)
  emails/              react-email templates
  generated/prisma/    generated client -- never edit
prisma/                schema, migrations, seeds/roles.ts
```

- **Reads** happen in Server Components that call `server/db` directly.
- **Writes** go through Server Actions in `server/actions`. Every action:
  1. `verifySession()` — who is calling
  2. `requireMembership(userId, orgSlug)` — they belong to this org
  3. `requirePermission(membership, "<resource>:<action>")` — their role allows it
  4. validates input, then calls `server/db`
  5. returns `{ error: string }` for expected failures; never leaks raw errors
- **Scope every query by organization.** Look records up by org + id/slug, so
  an id from another org reads as missing.
- **Permissions** are strings like `task:update` stored on `Role.permissions`
  (JSON) and seeded from `prisma/seeds/roles.ts`. Permission changes reach a
  database only when the seed is re-run (human-only).
- `hasPermission` is for hiding UI; actions must still call
  `requirePermission`. UI checks are never the only guard.
- `requireMembership` and other per-request lookups are wrapped in React
  `cache()` so a layout and its page share one query.

## Domain rules

- **Owners can't be revoked** — enforced in the revoke action, in the
  `deleteMembership` query, and by hiding the button. Use `OWNER_ROLE_NAME`
  from `src/lib/organization.ts`; never write the `"Owner"` literal.
- **Revoking a member unassigns their tasks and projects in that org**, in the
  same transaction as the membership delete.
- **Membership failures in `/dashboard/[orgSlug]` deliberately reach the root
  error page** (the layout's Sidebar calls `requireMembership`), so a wrong or
  revoked slug shows no dashboard UI.
- Only roles with `member:read` (currently Owner) can open the members page.

## Conventions

- **Tests live next to the code** (`foo.ts` → `foo.test.ts`). Add or update
  tests with every behavior change. Mock `@/server/db` / Prisma in unit tests;
  never hit a real database.
- **Comments explain why**, not what — match the density of the surrounding
  file.
- **Client error feedback:** inline messages in forms; `toast.error(...)`
  (Sonner) where there's no room inline, such as icon buttons in tables. Wrap
  Server Action calls from click handlers in `try/catch`, log with
  `console.error`, reset any pending state, and show a generic message for
  thrown errors (production hides their text).
- **Pending state:** buttons that trigger actions disable themselves and show
  `<Spinner />` while in flight.
- **Icons:** `@heroicons/react/20/solid`. Icon-only buttons need an
  `aria-label`; add a `Tooltip` where sighted users need the label too.
- Never pass full Prisma rows to Client Components — select only the fields
  the UI needs (e.g. never serialize `passwordHash`).
- Use the `@/` import alias. Don't edit `src/generated/`.
