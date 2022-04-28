import { render, screen } from "test/testUtils";
import BranchButton from "./BranchButton";
import React from "react";

describe("BranchButton", () => {
  it("renders properly", async () => {
    render(<BranchButton />);
    const buttonContainer = await screen.queryByTestId(
      "t--branch-button-container",
    );
    expect(buttonContainer).not.toBeNull();
    const currentBranch = await screen.queryByTestId(
      "t--branch-button-currentBranch",
    );
    expect(currentBranch?.innerHTML).toContain("*");
  });
});
