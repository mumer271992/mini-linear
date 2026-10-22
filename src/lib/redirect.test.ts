import { describe, expect, it } from "vitest";
import { buildAuthHref, firstSearchParam, getSafeRedirectPath } from "./redirect";

describe("getSafeRedirectPath", () => {
  it.each(["/dashboard", "/invite/abc123", "/dashboard/acme?tab=tasks"])(
    "allows the same-origin path %s",
    (path) => {
      expect(getSafeRedirectPath(path)).toBe(path);
    },
  );

  it.each([
    ["an absolute URL", "https://evil.com"],
    ["a protocol-relative URL", "//evil.com"],
    ["a backslash trick", "/\\evil.com"],
    ["a path without a leading slash", "dashboard"],
    ["a javascript: URL", "javascript:alert(1)"],
    ["an empty string", ""],
  ])("rejects %s", (_, path) => {
    expect(getSafeRedirectPath(path)).toBeNull();
  });

  it("rejects non-strings", () => {
    expect(getSafeRedirectPath(undefined)).toBeNull();
    expect(getSafeRedirectPath(["/dashboard"])).toBeNull();
  });
});

describe("firstSearchParam", () => {
  it("returns a single value as-is and the first of a repeated one", () => {
    expect(firstSearchParam("a")).toBe("a");
    expect(firstSearchParam(["a", "b"])).toBe("a");
    expect(firstSearchParam(undefined)).toBeUndefined();
  });
});

describe("buildAuthHref", () => {
  it("returns the bare path when there's nothing to carry", () => {
    expect(buildAuthHref("/signup", {})).toBe("/signup");
    expect(buildAuthHref("/login", { next: null, email: "" })).toBe("/login");
  });

  it("encodes next and email into the query string", () => {
    expect(buildAuthHref("/signup", { next: "/invite/abc", email: "bob+1@example.com" })).toBe(
      "/signup?next=%2Finvite%2Fabc&email=bob%2B1%40example.com",
    );
  });
});
