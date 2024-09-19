import { render, screen } from "test/testUtils";
import BranchButton from "./BranchButton";
import React from "react";

describe("BranchButton", () => {
  it("renders properly", async () => {
    render(<BranchButton />);
    const currentBranch = screen.queryByTestId(
      "t--branch-button-currentBranch",
    );

    expect(currentBranch?.innerHTML).toContain("*");
  });
});
