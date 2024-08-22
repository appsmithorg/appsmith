import React from "react";

import "@testing-library/jest-dom";
import "jest-styled-components";
import renderer from "react-test-renderer";

import { OVERLAY_COLOR } from "../constants";
import AutoHeightLimitHandleBorder from "./AutoHeightLimitHandleBorder";

describe("<AutoHeightLimitHandleBorder />", () => {
  it("should have background-color style set to OVERLAY_COLOR when isActive is true", () => {
    const tree = renderer
      .create(<AutoHeightLimitHandleBorder isActive />)
      .toJSON();
    expect(tree).toHaveStyleRule("background-color", OVERLAY_COLOR);
  });

  it("should have background-color style set to undefined when isActive is false", () => {
    const tree = renderer
      .create(<AutoHeightLimitHandleBorder isActive={false} />)
      .toJSON();
    expect(tree).toHaveStyleRule("background-color");
  });
});
