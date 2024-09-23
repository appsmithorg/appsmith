import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import "jest-styled-components";
import React from "react";
import renderer from "react-test-renderer";
import { RenderModes } from "constants/WidgetConstants";
import AutoHeightContainer from "./AutoHeightContainer";

const DUMMY_WIDGET = {
  bottomRow: 0,
  isLoading: false,
  leftColumn: 0,
  parentColumnSpace: 0,
  parentRowSpace: 0,
  renderMode: RenderModes.CANVAS,
  rightColumn: 0,
  topRow: 0,
  type: "SKELETON_WIDGET",
  version: 2,
  widgetId: "",
  widgetName: "",
};

describe("<AutoHeightContainer />", () => {
  it("should wrap the children in a div whose height is auto.", async () => {
    const tree = renderer
      .create(
        <AutoHeightContainer
          isAutoHeightWithLimits={false}
          maxDynamicHeight={0}
          minDynamicHeight={0}
          widgetHeightInPixels={200}
          widgetProps={DUMMY_WIDGET}
        >
          <div data-testid="test" />
        </AutoHeightContainer>,
      )
      .toJSON();

    expect(tree).toHaveStyleRule("height", "100%");
  });

  describe("when isAutoHeightWithLimits is false.", () => {
    it("should wrap the children in a simple div with class auto-height-container", async () => {
      const getTestComponent = () => (
        <AutoHeightContainer
          isAutoHeightWithLimits={false}
          maxDynamicHeight={0}
          minDynamicHeight={0}
          widgetHeightInPixels={200}
          widgetProps={DUMMY_WIDGET}
        >
          <div data-testid="test" />
        </AutoHeightContainer>
      );
      const component = getTestComponent();
      const renderResult = render(component);
      const child = await renderResult.findByTestId("test");

      expect(
        child.parentElement?.classList.contains("auto-height-container"),
      ).toBe(true);
    });
  });

  describe("when isAutoHeightWithLimits is true", () => {
    it("should wrap the children in a div of class auto-height-container and then a div with class auto-height-scroll-container", async () => {
      const getTestComponent = () => (
        <AutoHeightContainer
          isAutoHeightWithLimits
          maxDynamicHeight={0}
          minDynamicHeight={0}
          widgetHeightInPixels={200}
          widgetProps={DUMMY_WIDGET}
        >
          <div data-testid="test" />
        </AutoHeightContainer>
      );
      const component = getTestComponent();
      const renderResult = render(component);
      const child = await renderResult.findByTestId("test");

      expect(child.parentElement?.tagName).toBe("DIV");
      expect(
        child.parentElement?.classList.contains("auto-height-container"),
      ).toBe(true);
      expect(
        child.parentElement?.parentElement?.parentElement?.classList.contains(
          "auto-height-scroll-container",
        ),
      ).toBe(true);
    });
  });
});
