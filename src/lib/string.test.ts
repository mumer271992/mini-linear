import { describe, expect, it } from "vitest";
import { slugify } from "./string";

describe("slugify", () => {
  it("lowercases and hyphenates spaces", () => {
    expect(slugify("My Organization")).toBe("my-organization");
  });

  it("collapses non-alphanumeric runs into a single hyphen", () => {
    expect(slugify("Acme & Co.!!")).toBe("acme-co");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("  --Acme--  ")).toBe("acme");
  });
});
