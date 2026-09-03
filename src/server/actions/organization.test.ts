import { beforeEach, describe, expect, it, vi } from "vitest";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { verifySession } from "@/server/db/session";
import {
  createOrganizationWithOwner,
  findOrganizationBySlug,
} from "@/server/db/organization";
import { createOrganization } from "./organization";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/server/db/session", () => ({ verifySession: vi.fn() }));
vi.mock("@/server/db/organization", () => ({
  createOrganizationWithOwner: vi.fn(),
  findOrganizationBySlug: vi.fn(),
}));

const mockedVerifySession = vi.mocked(verifySession);
const mockedFindOrganizationBySlug = vi.mocked(findOrganizationBySlug);
const mockedCreateOrganizationWithOwner = vi.mocked(
  createOrganizationWithOwner,
);
const mockedRedirect = vi.mocked(redirect);

beforeEach(() => {
  vi.clearAllMocks();
  mockedVerifySession.mockResolvedValue({
    sessionId: "session-1",
    userId: "user-1",
    lastOrganizationId: null,
  });
  mockedFindOrganizationBySlug.mockResolvedValue(null);
});

describe("createOrganization", () => {
  it("rejects a name shorter than 2 characters", async () => {
    const result = await createOrganization({ name: "A", slug: "acme" });
    expect(result).toEqual({
      error: "Organization name must be at least 2 characters.",
    });
    expect(mockedCreateOrganizationWithOwner).not.toHaveBeenCalled();
  });

  it("rejects a slug with invalid characters", async () => {
    const result = await createOrganization({ name: "Acme", slug: "Acme Inc" });
    expect(result).toEqual({
      error: "Slug can only contain lowercase letters, numbers, and hyphens.",
    });
    expect(mockedCreateOrganizationWithOwner).not.toHaveBeenCalled();
  });

  it("rejects when the slug is already taken", async () => {
    mockedFindOrganizationBySlug.mockResolvedValue({
      id: "org-existing",
      slug: "acme",
    } as never);

    const result = await createOrganization({ name: "Acme", slug: "acme" });

    expect(result).toEqual({
      error: "An organization with this slug already exists.",
    });
    expect(mockedCreateOrganizationWithOwner).not.toHaveBeenCalled();
  });

  it("creates the organization and redirects on success", async () => {
    mockedCreateOrganizationWithOwner.mockResolvedValue({
      id: "org-1",
      slug: "acme",
    } as never);

    await createOrganization({ name: "Acme", slug: "acme" });

    expect(mockedCreateOrganizationWithOwner).toHaveBeenCalledWith({
      name: "Acme",
      slug: "acme",
      ownerId: "user-1",
    });
    expect(mockedRedirect).toHaveBeenCalledWith("/dashboard/acme");
  });

  it("treats a concurrent duplicate slug (P2002) as a normal error message", async () => {
    mockedCreateOrganizationWithOwner.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "6.19.3",
      }),
    );

    const result = await createOrganization({ name: "Acme", slug: "acme" });

    expect(result).toEqual({
      error: "An organization with this slug already exists.",
    });
    expect(mockedRedirect).not.toHaveBeenCalled();
  });

  it("returns a generic error for unexpected failures", async () => {
    mockedCreateOrganizationWithOwner.mockRejectedValue(
      new Error("connection reset"),
    );

    const result = await createOrganization({ name: "Acme", slug: "acme" });

    expect(result).toEqual({ error: "Something went wrong. Please try again." });
    expect(mockedRedirect).not.toHaveBeenCalled();
  });
});
