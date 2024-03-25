import DefaultTag from "./DefaultTag";
import { render, screen } from "test/testUtils";
import React from "react";
import "jest-styled-components";

describe("DefaultTag", () => {
  it("renders properly", async () => {
    render(<DefaultTag />);
    const actual = screen.queryByTestId("t--default-tag");

    // renders
    expect(actual).not.toBeNull();

    // contains Default text
    expect(actual?.innerHTML.includes("Default")).toBeTruthy();
  });
});
