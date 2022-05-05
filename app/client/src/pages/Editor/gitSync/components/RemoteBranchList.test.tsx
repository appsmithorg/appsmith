import { render, screen } from "test/testUtils";
import "jest-styled-components";

import { RemoteBranchList } from "./RemoteBranchList";

describe("RemoteBranchList", function() {
  it("renders nothing when param:remoteBranches is an empty array", async () => {
    render(RemoteBranchList([], () => undefined));

    const renderedList = await screen.queryByTestId(
      "t--git-remote-branch-list-container",
    );
    expect(renderedList?.innerHTML).toBeFalsy();
  });

  it("renders one branch list item when param:remoteBranches contains only one string", async () => {
    render(RemoteBranchList(["origin/one"], () => undefined));

    const renderedList = screen.queryByTestId(
      "t--git-remote-branch-list-container",
    );
    expect(renderedList).not.toBeNull();
    expect(renderedList?.innerHTML.includes("Remote branches")).toBeTruthy();
    expect(renderedList?.children.length).toEqual(2);

    // contains styled segment header
    const header = await screen.queryByTestId("t--styled-segment-header");
    expect(header).not.toBeNull();
    expect(header?.innerHTML.includes("Remote branches")).toBeTruthy();
  });
});
