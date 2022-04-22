import DefaultTag from "./DefaultTag";
import { render, screen } from "test/testUtils";
import React from "react";
import "jest-styled-components";

describe("DefaultTag", () => {
  it("renders properly", async () => {
    render(<DefaultTag />);
    const actual = await screen.queryByTestId("t--default-tag");

    // renders
    expect(actual).not.toBeNull();

    // contains DEFAULT text
    expect(actual?.innerHTML.includes("DEFAULT")).toBeTruthy();

    // styles
    expect(actual).toHaveStyleRule("display", "inline-block");
    expect(actual).toHaveStyleRule("padding", "3px 7px");
    expect(actual).toHaveStyleRule("position", "absolute");
    expect(actual).toHaveStyleRule("right", "16%");
  });
});
