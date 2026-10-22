import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { logout } from "@/server/actions/auth";
import { OrganizationSwitcher } from "./organization-switcher";

vi.mock("@/server/actions/auth", () => ({ logout: vi.fn() }));

const organizations = [
  { id: "org-1", name: "Acme", slug: "acme" },
  { id: "org-2", name: "Widgets Inc", slug: "widgets" },
];

describe("OrganizationSwitcher", () => {
  it("shows the current organization's name on the toggle button", () => {
    render(
      <OrganizationSwitcher
        organizations={organizations}
        currentOrganizationId="org-1"
        userEmail="alice@example.com"
      />,
    );
    expect(screen.getByRole("button")).toHaveTextContent("Acme");
  });

  it("dropdown is closed by default", () => {
    render(
      <OrganizationSwitcher
        organizations={organizations}
        currentOrganizationId="org-1"
        userEmail="alice@example.com"
      />,
    );
    expect(screen.queryByText("Widgets Inc")).not.toBeInTheDocument();
  });

  it("opens the dropdown and lists all organizations on toggle click", async () => {
    const user = userEvent.setup();
    render(
      <OrganizationSwitcher
        organizations={organizations}
        currentOrganizationId="org-1"
        userEmail="alice@example.com"
      />,
    );

    await user.click(screen.getByRole("button", { expanded: false }));

    expect(
      screen.getByRole("link", { name: /Acme/ }),
    ).toHaveAttribute("href", "/dashboard/acme");
    expect(
      screen.getByRole("link", { name: "Widgets Inc" }),
    ).toHaveAttribute("href", "/dashboard/widgets");
  });

  it("includes a link to create a new organization", async () => {
    const user = userEvent.setup();
    render(
      <OrganizationSwitcher
        organizations={organizations}
        currentOrganizationId="org-1"
        userEmail="alice@example.com"
      />,
    );

    await user.click(screen.getByRole("button"));

    expect(
      screen.getByRole("link", { name: "Create new organization" }),
    ).toHaveAttribute("href", "/onboarding");
  });

  it("links the logged-in user's email to account settings for the current org", async () => {
    const user = userEvent.setup();
    render(
      <OrganizationSwitcher
        organizations={organizations}
        currentOrganizationId="org-1"
        userEmail="alice@example.com"
      />,
    );

    await user.click(screen.getByRole("button"));

    expect(
      screen.getByRole("link", { name: "alice@example.com" }),
    ).toHaveAttribute("href", "/dashboard/acme/settings/account");
  });

  it("logs out when Log out is clicked", async () => {
    const user = userEvent.setup();
    render(
      <OrganizationSwitcher
        organizations={organizations}
        currentOrganizationId="org-1"
        userEmail="alice@example.com"
      />,
    );

    await user.click(screen.getByRole("button", { name: /Acme/ }));
    await user.click(screen.getByRole("button", { name: "Log out" }));

    expect(vi.mocked(logout)).toHaveBeenCalledWith();
  });

  it("closes the dropdown when clicking outside", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <OrganizationSwitcher
          organizations={organizations}
          currentOrganizationId="org-1"
          userEmail="alice@example.com"
        />
        <button>Outside</button>
      </div>,
    );

    await user.click(screen.getByRole("button", { name: /Acme/ }));
    expect(screen.getByText("Widgets Inc")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Outside" }));
    expect(screen.queryByText("Widgets Inc")).not.toBeInTheDocument();
  });
});
