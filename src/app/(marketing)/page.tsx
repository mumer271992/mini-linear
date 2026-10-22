import Link from "next/link";
import { getTaskStatusOption } from "@/lib/task";
import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/generated/prisma/client";
import { GITHUB_URL } from "@/lib/site";
import { ProductPreview } from "@/components/marketing/product-preview";

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

const WORKFLOW_STEPS: { status: TaskStatus; meaning: string }[] = [
  { status: "BACKLOG", meaning: "Captured, not scheduled yet." },
  { status: "TODO", meaning: "Ready for someone to pick up." },
  { status: "IN_PROGRESS", meaning: "Someone is working on it." },
  { status: "IN_REVIEW", meaning: "Waiting on a second look." },
  { status: "DONE", meaning: "Shipped." },
];

const HIERARCHY = [
  {
    name: "Organization",
    description:
      "Your team's workspace. Invite people by email, give each of them a role, and switch between organizations from the sidebar. The overview counts tasks by status across every project.",
  },
  {
    name: "Project",
    description:
      "A body of work with its own status, priority, lead, and target date, so you can see what's planned and what's late.",
  },
  {
    name: "Task",
    description:
      "The unit of work. Assign it, move it through the workflow, and filter the list by status or assignee.",
  },
];

const STACK = [
  { name: "Next.js 16 and React 19", detail: "App Router, server components for reads, server actions for every write." },
  { name: "TypeScript", detail: "End to end, including types generated from the database schema." },
  { name: "Prisma and PostgreSQL", detail: "Schema, migrations, and seeded roles." },
  { name: "Custom auth", detail: "Database sessions signed with jose, passwords hashed with bcrypt." },
  { name: "Zod and React Hook Form", detail: "Typed form validation with inline errors." },
  { name: "Resend and React Email", detail: "Invite emails written as React components." },
  { name: "Tailwind CSS v4", detail: "Styling, light and dark." },
  { name: "Vitest and Testing Library", detail: "Unit and component tests next to the code they cover." },
];

export default function Home() {
  return (
    <div className="bg-paper text-ink">
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-16 sm:pt-28">
        <h1 className="max-w-3xl font-display text-5xl leading-[0.95] font-bold tracking-[-0.035em] sm:text-7xl">
          Track every task from backlog to done.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
          Mini Linear is a lightweight issue tracker for small teams. Group work
          into projects, move tasks through one clear workflow, and see where
          everything stands at a glance.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/signup"
            className={cn("rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-opacity hover:opacity-85", FOCUS_RING)}
          >
            Create an account
          </Link>
          <Link
            href="/login"
            className={cn("rounded-full border border-rule px-5 py-2.5 text-sm font-medium transition-colors hover:bg-surface", FOCUS_RING)}
          >
            Log in
          </Link>
        </div>

        <div className="mt-16 sm:mt-20">
          <ProductPreview />
        </div>
      </section>

      <section className="border-t border-rule">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="max-w-xl font-display text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
            One workflow for every task
          </h2>
          <p className="mt-4 max-w-xl text-muted">
            Every task moves through the same five steps, so anyone on the team
            can tell what&apos;s happening without asking.
          </p>

          <ol className="mt-12 grid gap-8 md:grid-cols-5 md:gap-0">
            {WORKFLOW_STEPS.map(({ status, meaning }, index) => {
              const option = getTaskStatusOption(status);
              return (
                <li key={status} className="relative flex gap-4 md:flex-col md:pr-6">
                  {/* Connector to the next step: vertical on mobile, horizontal from md up. */}
                  {index < WORKFLOW_STEPS.length - 1 && (
                    <span
                      aria-hidden
                      className="absolute top-5 left-[5px] h-[calc(100%+1rem)] w-px bg-rule md:top-[5px] md:left-3 md:h-px md:w-[calc(100%-0.75rem)]"
                    />
                  )}
                  <span className={cn("relative mt-1.5 h-3 w-3 shrink-0 rounded-full ring-4 ring-paper md:mt-0", option.dotColor)} />
                  <div>
                    <p className="font-medium">{option.label}</p>
                    <p className="mt-1 text-sm text-muted">{meaning}</p>
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="mt-10 flex items-center gap-3 text-sm text-muted">
            <span className={cn("h-2 w-2 rounded-full", getTaskStatusOption("CANCELLED").dotColor)} />
            Dropped work goes to Cancelled, so it stays on record instead of being deleted.
          </p>
        </div>
      </section>

      <section className="border-t border-rule">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
              Organized the way teams already work
            </h2>
            <p className="mt-4 max-w-md text-muted">
              Three levels, each inside the one above it. Nothing to configure
              before you can start.
            </p>
          </div>

          <div>
            {HIERARCHY.map((level, index) => (
              <div
                key={level.name}
                className="border-l border-rule py-5 pl-6"
                style={{ marginLeft: `${index * 1.5}rem` }}
              >
                <h3 className="font-display text-2xl font-semibold tracking-[-0.02em]">{level.name}</h3>
                <p className="mt-2 max-w-lg leading-relaxed text-muted">{level.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-rule">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
            How it&apos;s built
          </h2>
          <p className="mt-4 max-w-xl text-muted">
            A portfolio project, built as a full-stack app rather than a mockup.
            The code is on{" "}
            <a href={GITHUB_URL} className={cn("text-ink underline underline-offset-4 hover:decoration-2", FOCUS_RING)}>
              GitHub
            </a>
            .
          </p>

          <dl className="mt-10 grid gap-x-12 sm:grid-cols-2">
            {STACK.map((item) => (
              <div key={item.name} className="border-t border-rule py-4">
                <dt className="font-medium">{item.name}</dt>
                <dd className="mt-1 text-sm text-muted">{item.detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="border-t border-rule">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 py-20 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="max-w-lg font-display text-4xl font-bold tracking-[-0.03em] sm:text-5xl">
            Create an organization and add your first project.
          </h2>
          <Link
            href="/signup"
            className={cn("shrink-0 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-opacity hover:opacity-85", FOCUS_RING)}
          >
            Create an account
          </Link>
        </div>
      </section>
    </div>
  );
}
