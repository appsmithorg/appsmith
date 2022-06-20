import { render, screen } from "test/testUtils";
import "jest-styled-components";

import { RemoteBranchListItem } from "./RemoteBranchListItem";
import React from "react";

describe("RemoteBranchListItem", function() {
  it("renders item properly", async () => {
    render(
      <RemoteBranchListItem
        branch="origin/what"
        className="remote-branch-item"
        onClick={() => undefined}
      />,
    );

    const rendered = Array.from(
      screen.queryAllByTestId("t--git-remote-branch-item"),
    );
    expect(
      rendered.filter((r) => r?.innerHTML === "origin/what")[0],
    ).not.toBeNull();
  });
});
