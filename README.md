# Mini Linear

A lightweight issue tracker for small teams: organizations, projects, and tasks
that move from backlog to done.

**Live demo:** <!-- TODO: add deployed URL -->

## Features

- **Organizations** — create a workspace, switch between organizations from
  the sidebar, and see task counts by status on the overview.
- **Members and roles** — invite people by email (Resend), assign a role, and
  revoke access. Owners can't be removed; revoking a member unassigns their
  work.
- **Projects** — status, priority, lead, and target date.
- **Tasks** — assign, move through Backlog → Todo → In Progress → In Review →
  Done, and filter by status or assignee.
- **Role-based permissions** — every write is checked on the server, not just
  hidden in the UI.

## Tech stack

Next.js 16 (App Router, Server Components, Server Actions) · React 19 ·
TypeScript · Prisma + PostgreSQL (Supabase) · Tailwind CSS 4 ·
react-hook-form + zod · Resend · Vitest + Testing Library · Vercel

## Getting started

Requirements: Node 22, a PostgreSQL database (the project uses Supabase), and
a Resend account for invite emails.

```bash
npm install
cp .env.example .env      # fill in the values -- each one is documented
npm run seed              # seeds roles and their permissions
npm run dev               # http://localhost:3000
```

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run test` | Run unit and component tests |
| `npm run typecheck` | Type-check the project |
| `npm run lint` | Lint |
| `npm run migrate <name>` | Create and apply a migration (see `scripts/migrate.sh`) |
| `npm run seed` | Seed or update roles and permissions (safe to re-run) |

## Project structure

```
src/app/            routes (marketing, auth, dashboard/[orgSlug]/...)
src/components/     feature components, plus ui/ primitives
src/server/db/      data access -- the only layer that talks to Prisma
src/server/actions/ server actions: session → membership → permission → db
src/lib/            shared pure helpers
prisma/             schema, migrations, role seeds
```

## How this was built: an AI-assisted workflow

This project is built with [Claude Code](https://claude.com/claude-code) as a
pair programmer, with a human making every decision.

- **Shared instructions.** [`AGENTS.md`](./AGENTS.md) gives any AI agent the
  architecture, conventions, and a working agreement. `CLAUDE.md` imports it,
  so there's one source of truth for all tools.
- **Human in the loop.** The agent proposes each change and waits for
  approval, works one step at a time, and never runs database migrations or
  seeds, commits, or pushes. Those stay with the human.
- **Review → triage → fix.** Changes are reviewed with Claude Code's
  `/code-review`. Each finding is triaged as fix, optional, or skip with a
  reason, and some are kept on purpose as design decisions.
- **Guardrails, not trust.** Every change must pass tests, typecheck, and lint
  locally, and CI runs the same checks on every pull request.
