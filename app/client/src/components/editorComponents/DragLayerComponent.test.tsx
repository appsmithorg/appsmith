import React from "react";
import { ThemeProvider } from "styled-components";
import TestRenderer from "react-test-renderer";
import DragLayerComponent from "./DragLayerComponent";
import { RenderModes } from "constants/WidgetConstants";
import { theme } from "constants/DefaultTheme";

describe("DragLayerComponent", () => {
  it("it checks noPad prop", () => {
    const dummyWidget = {
      type: "CANVAS_WIDGET",
      widgetId: "0",
      widgetName: "canvas",
      parentColumnSpace: 1,
      parentRowSpace: 1,
      parentRowHeight: 0,
      canDropTargetExtend: false,
      parentColumnWidth: 0,
      leftColumn: 0,
      visible: true,
      rightColumn: 0,
      topRow: 0,
      bottomRow: 0,
      version: 17,
      isLoading: false,
      renderMode: RenderModes.CANVAS,
      children: [],
      noPad: true,
      onBoundsUpdate: () => {
        //
      },
      isOver: true,
      parentWidgetId: "parent",
      force: true,
    };
    const testRenderer = TestRenderer.create(
      <ThemeProvider theme={theme}>
        <DragLayerComponent {...dummyWidget} />
      </ThemeProvider>,
    );
    const testInstance = testRenderer.root;

    expect(testInstance.findByType(DragLayerComponent).props.noPad).toBe(true);
  });
});
