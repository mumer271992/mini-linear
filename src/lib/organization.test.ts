import { describe, expect, it } from "vitest";
import { selectDefaultOrganization } from "./organization";

const organizations = [
  { id: "org-1" },
  { id: "org-2" },
  { id: "org-3" },
];

describe("selectDefaultOrganization", () => {
  it("returns the organization matching lastOrganizationId", () => {
    expect(selectDefaultOrganization(organizations, "org-2")).toBe(
      organizations[1],
    );
  });

  it("falls back to the first organization when lastOrganizationId doesn't match any", () => {
    expect(selectDefaultOrganization(organizations, "org-does-not-exist")).toBe(
      organizations[0],
    );
  });

  it("falls back to the first organization when lastOrganizationId is null", () => {
    expect(selectDefaultOrganization(organizations, null)).toBe(
      organizations[0],
    );
  });

  it("returns undefined when there are no organizations", () => {
    expect(selectDefaultOrganization([], null)).toBeUndefined();
  });
});
