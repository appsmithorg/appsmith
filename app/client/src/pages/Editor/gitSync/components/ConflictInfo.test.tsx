import ConflictInfo from "./ConflictInfo";
import { render, screen } from "test/testUtils";
import React from "react";

describe("ConflictInfo", () => {
  it("renders properly", async () => {
    render(
      <ConflictInfo
        browserSupportedRemoteUrl={"href"}
        learnMoreLink={"link"}
      />,
    );

    // check for existence
    [
      screen.queryByTestId("t--conflict-info-container"),
      screen.queryByTestId("t--conflict-info-error-warning"),
    ].every((query) => {
      expect(query).not.toBeNull();

      return true;
    });

    //check for text
    const container = screen.getByTestId("t--conflict-info-container");
    const html = container.innerHTML.toString();

    expect(html.includes("Learn more")).toBeTruthy();
    expect(html.includes("Open repository")).toBeTruthy();
    expect(
      html.includes(
        "Please resolve the merge conflicts manually on your repository.",
      ),
    ).toBeTruthy();
  });
});
