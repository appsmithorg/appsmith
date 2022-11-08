import React from "react";
import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import AutoHeightOverlay from "./AutoHeightOverlay";
import "jest-styled-components";
import renderer from "react-test-renderer";
import { WidgetProps } from "widgets/BaseWidget";
import { RenderModes } from "constants/WidgetConstants";
import { Provider } from "react-redux";
import store from "store";

const DUMMY_WIDGET: WidgetProps = {
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

describe("<AutoHeightOverlay />", () => {
  it("should return null if Auto Height is not enabled.", async () => {
    const emptyFn = jest.fn();
    const tree = renderer
      .create(
        <Provider store={store}>
          <AutoHeightOverlay
            batchUpdate={emptyFn}
            maxDynamicHeight={0}
            minDynamicHeight={0}
            onMaxHeightSet={emptyFn}
            onMinHeightSet={emptyFn}
            {...DUMMY_WIDGET}
            dynamicHeight="AUTO_HEIGHT"
          />
        </Provider>,
      )
      .toJSON();
    console.log(tree);
  });
});
