import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { login } from "@/server/actions/auth";
import { LoginForm } from "./login-form";

vi.mock("@/server/actions/auth", () => ({
  login: vi.fn(),
}));

const mockedLogin = vi.mocked(login);

describe("LoginForm", () => {
  it("shows a validation error for an invalid email", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(
      await screen.findByText("Enter a valid email address"),
    ).toBeInTheDocument();
    expect(mockedLogin).not.toHaveBeenCalled();
  });

  it("shows a validation error for a password that's too short", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

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
    render(<LoginForm />);

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
    render(<LoginForm />);

    await user.type(screen.getByLabelText("Email"), "jane@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(
      await screen.findByText("Invalid email or password."),
    ).toBeInTheDocument();
  });

  it("links to the forgot password and signup pages", () => {
    render(<LoginForm />);
    expect(
      screen.getByRole("link", { name: "Forgot password?" }),
    ).toHaveAttribute("href", "/forgot-password");
    expect(screen.getByRole("link", { name: "Sign up" })).toHaveAttribute(
      "href",
      "/signup",
    );
  });

  it("prefills the email when given one", () => {
    render(<LoginForm defaultEmail="bob@example.com" />);
    expect(screen.getByLabelText("Email")).toHaveValue("bob@example.com");
  });

  it("passes next through to login", async () => {
    mockedLogin.mockResolvedValue(undefined as never);
    const user = userEvent.setup();
    render(<LoginForm next="/invite/abc" />);

    await user.type(screen.getByLabelText("Email"), "jane@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(mockedLogin).toHaveBeenCalledWith({
      email: "jane@example.com",
      password: "password123",
      next: "/invite/abc",
    });
  });

  it("carries next and email over to the Sign up link", () => {
    render(<LoginForm next="/invite/abc" defaultEmail="bob@example.com" />);
    expect(screen.getByRole("link", { name: "Sign up" })).toHaveAttribute(
      "href",
      "/signup?next=%2Finvite%2Fabc&email=bob%40example.com",
    );
  });
});
