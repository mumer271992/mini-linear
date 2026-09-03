import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { signup } from "@/server/actions/auth";
import SignupPage from "./page";

vi.mock("@/server/actions/auth", () => ({
  signup: vi.fn(),
}));

const mockedSignup = vi.mocked(signup);

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Name"), "Jane Doe");
  await user.type(screen.getByLabelText("Email"), "jane@example.com");
  await user.type(screen.getByLabelText("Password"), "password123");
  await user.type(screen.getByLabelText("Confirm password"), "password123");
}

describe("SignupPage", () => {
  it("shows a validation error for a name that's too short", async () => {
    const user = userEvent.setup();
    render(<SignupPage />);

    await user.type(screen.getByLabelText("Name"), "A");
    await user.click(screen.getByRole("button", { name: "Sign up" }));

    expect(
      await screen.findByText("Name must be at least 2 characters"),
    ).toBeInTheDocument();
    expect(mockedSignup).not.toHaveBeenCalled();
  });

  it("shows a validation error for an invalid email", async () => {
    const user = userEvent.setup();
    render(<SignupPage />);

    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.click(screen.getByRole("button", { name: "Sign up" }));

    expect(
      await screen.findByText("Enter a valid email address"),
    ).toBeInTheDocument();
  });

  it("shows a validation error for a password that's too short", async () => {
    const user = userEvent.setup();
    render(<SignupPage />);

    await user.type(screen.getByLabelText("Password"), "short");
    await user.click(screen.getByRole("button", { name: "Sign up" }));

    expect(
      await screen.findByText("Password must be at least 8 characters"),
    ).toBeInTheDocument();
  });

  it("shows a validation error when passwords don't match", async () => {
    const user = userEvent.setup();
    render(<SignupPage />);

    await user.type(screen.getByLabelText("Name"), "Jane Doe");
    await user.type(screen.getByLabelText("Email"), "jane@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.type(screen.getByLabelText("Confirm password"), "different1");
    await user.click(screen.getByRole("button", { name: "Sign up" }));

    expect(
      await screen.findByText("Passwords do not match"),
    ).toBeInTheDocument();
    expect(mockedSignup).not.toHaveBeenCalled();
  });

  it("calls signup with the form values on valid submit", async () => {
    mockedSignup.mockResolvedValue(undefined as never);
    const user = userEvent.setup();
    render(<SignupPage />);

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Sign up" }));

    expect(mockedSignup).toHaveBeenCalledWith({
      name: "Jane Doe",
      email: "jane@example.com",
      password: "password123",
    });
  });

  it("shows the server-returned error message", async () => {
    mockedSignup.mockResolvedValue({
      error: "An account with this email already exists.",
    });
    const user = userEvent.setup();
    render(<SignupPage />);

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Sign up" }));

    expect(
      await screen.findByText("An account with this email already exists."),
    ).toBeInTheDocument();
  });

  it("links to the login page", () => {
    render(<SignupPage />);
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute(
      "href",
      "/login",
    );
  });
});
