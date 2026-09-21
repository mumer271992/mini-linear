import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getTodayDateString, isTargetDateValid } from "./project";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-15T12:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("getTodayDateString", () => {
  it("returns today's date as YYYY-MM-DD", () => {
    expect(getTodayDateString()).toBe("2026-06-15");
  });
});

describe("isTargetDateValid", () => {
  it("accepts today", () => {
    expect(isTargetDateValid("2026-06-15")).toBe(true);
  });

  it("accepts a future date", () => {
    expect(isTargetDateValid("2026-12-01")).toBe(true);
  });

  it("rejects a past date", () => {
    expect(isTargetDateValid("2026-06-14")).toBe(false);
  });
});
