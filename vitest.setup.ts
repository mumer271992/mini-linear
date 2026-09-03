import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// React Testing Library's own auto-cleanup hooks into a global `afterEach`,
// which doesn't exist since this project uses explicit imports rather than
// Vitest's `globals` mode -- without this, each test's rendered DOM leaks
// into the next test in the same file.
afterEach(cleanup);

// "server-only" resolves via a "react-server" export condition that only
// Next.js's own bundler sets -- under plain Vitest/Node resolution it always
// falls through to a file that unconditionally throws. Stubbing it to a
// no-op mirrors what Next's server bundle actually does with it.
vi.mock("server-only", () => ({}));
