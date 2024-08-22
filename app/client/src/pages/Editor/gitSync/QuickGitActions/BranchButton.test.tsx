import React from "react";

import { render, screen } from "test/testUtils";

import BranchButton from "./BranchButton";

describe("BranchButton", () => {
  it("renders properly", async () => {
    render(<BranchButton />);
    const currentBranch = screen.queryByTestId(
      "t--branch-button-currentBranch",
    );
    expect(currentBranch?.innerHTML).toContain("*");
  });
});
