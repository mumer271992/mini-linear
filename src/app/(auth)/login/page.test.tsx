import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { login } from "@/server/actions/auth";
import LoginPage from "./page";

vi.mock("@/server/actions/auth", () => ({
  login: vi.fn(),
}));

const mockedLogin = vi.mocked(login);

describe("LoginPage", () => {
  it("shows a validation error for an invalid email", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(
      await screen.findByText("Enter a valid email address"),
    ).toBeInTheDocument();
    expect(mockedLogin).not.toHaveBeenCalled();
  });

  it("shows a validation error for a password that's too short", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText("Email"), "jane@example.com");
    await user.type(screen.getByLabelText("Password"), "short");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(
      await screen.findByText("Password must be at least 8 characters"),
    ).toBeInTheDocument();
  });

  it("calls login with the form values on valid submit", async () => {
    mockedLogin.mockResolvedValue(undefined as never);
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText("Email"), "jane@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(mockedLogin).toHaveBeenCalledWith({
      email: "jane@example.com",
      password: "password123",
    });
  });

  it("shows the server-returned error message", async () => {
    mockedLogin.mockResolvedValue({ error: "Invalid email or password." });
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText("Email"), "jane@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(
      await screen.findByText("Invalid email or password."),
    ).toBeInTheDocument();
  });

  it("links to the forgot password and signup pages", () => {
    render(<LoginPage />);
    expect(
      screen.getByRole("link", { name: "Forgot password?" }),
    ).toHaveAttribute("href", "/forgot-password");
    expect(screen.getByRole("link", { name: "Sign up" })).toHaveAttribute(
      "href",
      "/signup",
    );
  });
});
