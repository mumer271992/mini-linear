import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { signup } from "@/server/actions/auth";
import { SignupForm } from "./signup-form";

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

describe("SignupForm", () => {
  it("shows a validation error for a name that's too short", async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByLabelText("Name"), "A");
    await user.click(screen.getByRole("button", { name: "Sign up" }));

    expect(
      await screen.findByText("Name must be at least 2 characters"),
    ).toBeInTheDocument();
    expect(mockedSignup).not.toHaveBeenCalled();
  });

  it("shows a validation error for an invalid email", async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.click(screen.getByRole("button", { name: "Sign up" }));

    expect(
      await screen.findByText("Enter a valid email address"),
    ).toBeInTheDocument();
  });

  it("shows a validation error for a password that's too short", async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByLabelText("Password"), "short");
    await user.click(screen.getByRole("button", { name: "Sign up" }));

    expect(
      await screen.findByText("Password must be at least 8 characters"),
    ).toBeInTheDocument();
  });

  it("shows a validation error when passwords don't match", async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

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
    render(<SignupForm />);

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
    render(<SignupForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Sign up" }));

    expect(
      await screen.findByText("An account with this email already exists."),
    ).toBeInTheDocument();
  });

  it("links to the login page", () => {
    render(<SignupForm />);
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("prefills the email but keeps it editable", async () => {
    const user = userEvent.setup();
    render(<SignupForm defaultEmail="bob@example.com" />);

    const email = screen.getByLabelText("Email");
    expect(email).toHaveValue("bob@example.com");
    expect(email).not.toHaveAttribute("readonly");
    expect(email).toBeEnabled();

    await user.clear(email);
    await user.type(email, "robert@example.com");
    expect(email).toHaveValue("robert@example.com");
  });

  it("passes next through to signup", async () => {
    mockedSignup.mockResolvedValue(undefined as never);
    const user = userEvent.setup();
    render(<SignupForm next="/invite/abc" defaultEmail="bob@example.com" />);

    await user.type(screen.getByLabelText("Name"), "Bob");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.type(screen.getByLabelText("Confirm password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign up" }));

    expect(mockedSignup).toHaveBeenCalledWith({
      name: "Bob",
      email: "bob@example.com",
      password: "password123",
      next: "/invite/abc",
    });
  });

  it("carries next and email over to the Log in link", () => {
    render(<SignupForm next="/invite/abc" defaultEmail="bob@example.com" />);
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute(
      "href",
      "/login?next=%2Finvite%2Fabc&email=bob%40example.com",
    );
  });
});
