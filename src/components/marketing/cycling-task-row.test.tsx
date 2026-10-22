import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { CyclingTaskRow } from "./cycling-task-row";

function stubReducedMotion(matches: boolean) {
  vi.stubGlobal("matchMedia", () => ({ matches }));
}

describe("CyclingTaskRow", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("starts in Backlog and steps through to Done", () => {
    vi.useFakeTimers();
    stubReducedMotion(false);
    render(<CyclingTaskRow />);
    expect(screen.getByText("Backlog")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(700));
    expect(screen.getByText("Todo")).toBeInTheDocument();

    act(() => vi.runAllTimers());
    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  it("jumps straight to Done when reduced motion is preferred", () => {
    vi.useFakeTimers();
    stubReducedMotion(true);
    render(<CyclingTaskRow />);

    act(() => vi.advanceTimersByTime(0));
    expect(screen.getByText("Done")).toBeInTheDocument();
  });
});
