import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createOrganization } from "@/server/actions/organization";
import { CreateOrganizationForm } from "./create-organization-form";

vi.mock("@/server/actions/organization", () => ({
  createOrganization: vi.fn(),
}));

const mockedCreateOrganization = vi.mocked(createOrganization);

describe("CreateOrganizationForm", () => {
  it("auto-fills the slug from the name until the slug is manually edited", async () => {
    const user = userEvent.setup();
    render(<CreateOrganizationForm />);

    await user.type(screen.getByLabelText("Name"), "Acme Inc");

    expect(screen.getByLabelText("Slug")).toHaveValue("acme-inc");
  });

  it("stops auto-filling the slug once the user edits it directly", async () => {
    const user = userEvent.setup();
    render(<CreateOrganizationForm />);

    await user.type(screen.getByLabelText("Name"), "Acme");
    await user.clear(screen.getByLabelText("Slug"));
    await user.type(screen.getByLabelText("Slug"), "custom-slug");
    await user.type(screen.getByLabelText("Name"), " Inc");

    expect(screen.getByLabelText("Slug")).toHaveValue("custom-slug");
  });

  it("shows validation errors instead of submitting when name is too short", async () => {
    const user = userEvent.setup();
    render(<CreateOrganizationForm />);

    await user.type(screen.getByLabelText("Name"), "A");
    await user.click(screen.getByRole("button", { name: "Create organization" }));

    expect(
      await screen.findByText("Organization name must be at least 2 characters"),
    ).toBeInTheDocument();
    expect(mockedCreateOrganization).not.toHaveBeenCalled();
  });

  it("calls createOrganization with the form values on valid submit", async () => {
    mockedCreateOrganization.mockResolvedValue(undefined as never);
    const user = userEvent.setup();
    render(<CreateOrganizationForm />);

    await user.type(screen.getByLabelText("Name"), "Acme Inc");
    await user.click(screen.getByRole("button", { name: "Create organization" }));

    expect(mockedCreateOrganization).toHaveBeenCalledWith({
      name: "Acme Inc",
      slug: "acme-inc",
    });
  });

  it("shows the server-returned error message", async () => {
    mockedCreateOrganization.mockResolvedValue({
      error: "An organization with this slug already exists.",
    });
    const user = userEvent.setup();
    render(<CreateOrganizationForm />);

    await user.type(screen.getByLabelText("Name"), "Acme Inc");
    await user.click(screen.getByRole("button", { name: "Create organization" }));

    expect(
      await screen.findByText("An organization with this slug already exists."),
    ).toBeInTheDocument();
  });
});
