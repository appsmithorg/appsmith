import React from "react";
import "@testing-library/jest-dom";
import AutoHeightLimitHandleLabel from "./AutoHeightLimitHandleLabel";
import "jest-styled-components";
import renderer from "react-test-renderer";

describe("<AutoHeightLimitHandleLabel />", () => {
  it("should have display none when isActive is false", () => {
    const tree = renderer
      .create(<AutoHeightLimitHandleLabel isActive={false} />)
      .toJSON();

    expect(tree).toHaveStyleRule("display", "none");
  });

  it("should have display initial when isActive is true", () => {
    const tree = renderer
      .create(<AutoHeightLimitHandleLabel isActive />)
      .toJSON();

    expect(tree).toHaveStyleRule("display", "initial");
  });
});
