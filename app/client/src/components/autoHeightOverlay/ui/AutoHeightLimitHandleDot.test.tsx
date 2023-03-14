import React from "react";
import "@testing-library/jest-dom";
import AutoHeightLimitHandleDot from "./AutoHeightLimitHandleDot";
import "jest-styled-components";
import renderer from "react-test-renderer";
import { OVERLAY_COLOR } from "../constants";

describe("<AutoHeightLimitHandleDot />", () => {
  it("should have scale style set to 1 when isDragging is false", () => {
    const tree = renderer
      .create(<AutoHeightLimitHandleDot isDragging={false} />)
      .toJSON();
    expect(tree).toHaveStyleRule("transform", "translateX(-50%) scale( 1 )");
  });

  it("should have scale style set to 1.67 when isDragging is true", () => {
    const tree = renderer
      .create(<AutoHeightLimitHandleDot isDragging />)
      .toJSON();
    expect(tree).toHaveStyleRule("transform", "translateX(-50%) scale( 1.67 )");
  });
});
