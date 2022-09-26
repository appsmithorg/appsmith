import { render, screen } from "test/testUtils";
import "jest-styled-components";
import { LocalBranchList } from "./LocalBranchList";

describe("LocalBranchList", function() {
  it("renders nothing when param:remoteBranches is an empty array", async () => {
    render(LocalBranchList([], "", false, -1, "", () => undefined));

    const renderedList = screen.queryByTestId(
      "t--git-local-branch-list-container",
    );
    expect(renderedList?.innerHTML).toBeFalsy();
  });
});
