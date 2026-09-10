import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { CreateProjectModal } from "./create-project-modal";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

// CreateProjectForm has its own thorough test suite already -- stub it here
// so this file only tests what's actually specific to this wrapper: wiring
// Modal's onClose to the right navigation.
vi.mock("@/components/create-project-form", () => ({
  CreateProjectForm: () => <div>create project form</div>,
}));

const mockedUseRouter = vi.mocked(useRouter);

describe("CreateProjectModal", () => {
  it("renders the form inside a modal", () => {
    mockedUseRouter.mockReturnValue({ push: vi.fn() } as never);
    render(<CreateProjectModal orgSlug="acme" members={[]} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("create project form")).toBeInTheDocument();
  });

  it("navigates to the org's projects list when the modal closes", async () => {
    const push = vi.fn();
    mockedUseRouter.mockReturnValue({ push } as never);
    const user = userEvent.setup();
    render(<CreateProjectModal orgSlug="acme" members={[]} />);

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(push).toHaveBeenCalledWith("/dashboard/acme/projects");
  });
});
