import React from "react";

import "@testing-library/jest-dom";
import "jest-styled-components";
import renderer from "react-test-renderer";

import AutoHeightLimitOverlayDisplay from "./AutoHeightLimitOverlayDisplay";

describe("<AutoHeightLimitOverlayDisplay />", () => {
  it("should have display none when isActive is false", () => {
    const tree = renderer
      .create(<AutoHeightLimitOverlayDisplay height={0} isActive={false} />)
      .toJSON();
    expect(tree).toHaveStyleRule("display", "none");
  });

  it("should have display block when isActive is true", () => {
    const tree = renderer
      .create(<AutoHeightLimitOverlayDisplay height={0} isActive />)
      .toJSON();
    expect(tree).toHaveStyleRule("display", "block");
  });

  it("should have height style equal to the height passed in props", () => {
    const tree = renderer
      .create(<AutoHeightLimitOverlayDisplay height={10} isActive />)
      .toJSON();
    expect(tree).toHaveStyleRule("height", "10px");
  });
});
