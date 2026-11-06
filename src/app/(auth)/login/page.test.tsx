import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import LoginPage from "./page";

// The form itself is covered in components/login-form.test.tsx -- stub it so
// this only checks what the page does with the search params.
vi.mock("@/components/login-form", () => ({
  LoginForm: ({
    next,
    defaultEmail,
    notice,
  }: {
    next?: string | null;
    defaultEmail?: string;
    notice?: { tone: string; message: string };
  }) => (
    <div>
      <span data-testid="next">{String(next)}</span>
      <span data-testid="email">{String(defaultEmail)}</span>
      <span data-testid="notice">{notice ? `${notice.tone}: ${notice.message}` : "none"}</span>
    </div>
  ),
}));

async function renderWith(searchParams: Record<string, string | string[] | undefined>) {
  const page = await LoginPage({ searchParams: Promise.resolve(searchParams) } as never);
  render(page);
}

describe("LoginPage", () => {
  it("passes a safe next path and the email through to the form", async () => {
    await renderWith({ next: "/invite/abc", email: "bob@example.com" });
    expect(screen.getByTestId("next")).toHaveTextContent("/invite/abc");
    expect(screen.getByTestId("email")).toHaveTextContent("bob@example.com");
  });

  it("drops an off-site next path", async () => {
    await renderWith({ next: "https://evil.com" });
    expect(screen.getByTestId("next")).toHaveTextContent("null");
  });

  it("uses the first value of a repeated param", async () => {
    await renderWith({ next: ["/invite/abc", "/other"] });
    expect(screen.getByTestId("next")).toHaveTextContent("/invite/abc");
  });

  it("passes nothing when there are no params", async () => {
    await renderWith({});
    expect(screen.getByTestId("next")).toHaveTextContent("null");
    expect(screen.getByTestId("email")).toHaveTextContent("undefined");
  });

  it("maps the email-verified notice to a success message", async () => {
    await renderWith({ notice: "email-verified" });
    expect(screen.getByTestId("notice")).toHaveTextContent("success: Email verified.");
  });

  it("maps the invalid-link notice to an error message", async () => {
    await renderWith({ notice: "verification-link-invalid" });
    expect(screen.getByTestId("notice")).toHaveTextContent("error: That verification link is invalid");
  });

  it("ignores unknown notice keys, including inherited object properties", async () => {
    await renderWith({ notice: "toString" });
    expect(screen.getByTestId("notice")).toHaveTextContent("none");
  });
});
