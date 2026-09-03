import { beforeEach, describe, expect, it, vi } from "vitest";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { generatePasswordHash, verifyPasswordHash } from "@/lib/auth";
import { createSession, deleteSession } from "@/server/db/session";
import { createUserWithEmail, findUserByEmail } from "@/server/db/user";
import { login, logout, signup } from "./auth";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/auth", () => ({
  generatePasswordHash: vi.fn(),
  verifyPasswordHash: vi.fn(),
}));
vi.mock("@/server/db/session", () => ({
  createSession: vi.fn(),
  deleteSession: vi.fn(),
}));
vi.mock("@/server/db/user", () => ({
  createUserWithEmail: vi.fn(),
  findUserByEmail: vi.fn(),
}));

const mockedGeneratePasswordHash = vi.mocked(generatePasswordHash);
const mockedVerifyPasswordHash = vi.mocked(verifyPasswordHash);
const mockedCreateSession = vi.mocked(createSession);
const mockedDeleteSession = vi.mocked(deleteSession);
const mockedCreateUserWithEmail = vi.mocked(createUserWithEmail);
const mockedFindUserByEmail = vi.mocked(findUserByEmail);
const mockedRedirect = vi.mocked(redirect);

beforeEach(() => {
  vi.clearAllMocks();
  mockedFindUserByEmail.mockResolvedValue(null);
});

describe("signup", () => {
  it("rejects a missing email", async () => {
    const result = await signup({ name: "A", email: "", password: "pw" });
    expect(result).toEqual({ error: "Email and password are required." });
  });

  it("rejects a missing password", async () => {
    const result = await signup({
      name: "A",
      email: "a@example.com",
      password: "",
    });
    expect(result).toEqual({ error: "Email and password are required." });
  });

  it("rejects an email that's already registered", async () => {
    mockedFindUserByEmail.mockResolvedValue({ id: "user-existing" } as never);

    const result = await signup({
      name: "A",
      email: "a@example.com",
      password: "pw",
    });

    expect(result).toEqual({
      error: "An account with this email already exists.",
    });
    expect(mockedCreateUserWithEmail).not.toHaveBeenCalled();
  });

  it("creates the user, session, and redirects on success", async () => {
    mockedGeneratePasswordHash.mockResolvedValue("hashed-pw");
    mockedCreateUserWithEmail.mockResolvedValue({ id: "user-1" } as never);

    await signup({ name: "A", email: "a@example.com", password: "pw" });

    expect(mockedCreateUserWithEmail).toHaveBeenCalledWith({
      name: "A",
      email: "a@example.com",
      passwordHash: "hashed-pw",
    });
    expect(mockedCreateSession).toHaveBeenCalledWith("user-1");
    expect(mockedRedirect).toHaveBeenCalledWith("/dashboard");
  });

  it("treats a concurrent duplicate email (P2002) as a normal error message", async () => {
    mockedGeneratePasswordHash.mockResolvedValue("hashed-pw");
    mockedCreateUserWithEmail.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "6.19.3",
      }),
    );

    const result = await signup({
      name: "A",
      email: "a@example.com",
      password: "pw",
    });

    expect(result).toEqual({
      error: "An account with this email already exists.",
    });
    expect(mockedCreateSession).not.toHaveBeenCalled();
  });
});

describe("login", () => {
  it("rejects missing credentials", async () => {
    const result = await login({ email: "", password: "" });
    expect(result).toEqual({ error: "Email and password are required." });
  });

  it("gives the same generic error when the user doesn't exist", async () => {
    mockedFindUserByEmail.mockResolvedValue(null);

    const result = await login({ email: "a@example.com", password: "pw" });

    expect(result).toEqual({ error: "Invalid email or password." });
  });

  it("gives the same generic error for an account with no password set", async () => {
    mockedFindUserByEmail.mockResolvedValue({
      id: "user-1",
      passwordHash: null,
    } as never);

    const result = await login({ email: "a@example.com", password: "pw" });

    expect(result).toEqual({ error: "Invalid email or password." });
  });

  it("gives the same generic error for a wrong password", async () => {
    mockedFindUserByEmail.mockResolvedValue({
      id: "user-1",
      passwordHash: "hashed-pw",
    } as never);
    mockedVerifyPasswordHash.mockResolvedValue(false);

    const result = await login({ email: "a@example.com", password: "wrong" });

    expect(result).toEqual({ error: "Invalid email or password." });
  });

  it("creates a session and redirects on success", async () => {
    mockedFindUserByEmail.mockResolvedValue({
      id: "user-1",
      passwordHash: "hashed-pw",
    } as never);
    mockedVerifyPasswordHash.mockResolvedValue(true);

    await login({ email: "a@example.com", password: "pw" });

    expect(mockedCreateSession).toHaveBeenCalledWith("user-1");
    expect(mockedRedirect).toHaveBeenCalledWith("/dashboard");
  });
});

describe("logout", () => {
  it("deletes the session and redirects to / when no fallback is given", async () => {
    await logout();

    expect(mockedDeleteSession).toHaveBeenCalled();
    expect(mockedRedirect).toHaveBeenCalledWith("/");
  });

  it("redirects to a safe relative fallback path", async () => {
    await logout("/signup");
    expect(mockedRedirect).toHaveBeenCalledWith("/signup");
  });

  it("falls back to / for an absolute external URL", async () => {
    await logout("https://evil.com");
    expect(mockedRedirect).toHaveBeenCalledWith("/");
  });

  it("falls back to / for a protocol-relative URL", async () => {
    await logout("//evil.com");
    expect(mockedRedirect).toHaveBeenCalledWith("/");
  });
});
