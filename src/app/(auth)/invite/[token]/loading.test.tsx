import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import AcceptInviteLoading from "./loading";

describe("AcceptInviteLoading", () => {
  it("announces that the invite is loading", () => {
    render(<AcceptInviteLoading />);
    expect(screen.getByRole("status", { name: "Loading invite" })).toBeInTheDocument();
  });
});
