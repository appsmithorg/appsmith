import BetaTag from "./BetaTag";
import { render, screen } from "test/testUtils";
import React from "react";
import "jest-styled-components";

describe("BetaTag", () => {
  it("renders properly", async () => {
    render(<BetaTag />);
    const actual = await screen.queryByTestId("t--beta-tag");

    // renders
    expect(actual).not.toBeNull();

    // contains BETA text
    expect(actual?.innerHTML.includes("BETA")).toBeTruthy();

    // styles
    expect(actual).toHaveStyleRule("height", "16px");
    expect(actual).toHaveStyleRule("width", "48px");
    expect(actual).toHaveStyleRule("display", "flex");
    expect(actual).toHaveStyleRule("justify-content", "center");
    expect(actual).toHaveStyleRule("align-items", "center");
    expect(actual).toHaveStyleRule("color", "#191919");
    expect(actual).toHaveStyleRule("border", "1px solid #191919");
  });
});
