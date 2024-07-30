import type { WidgetProps } from "widgets/BaseWidget";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import { select } from "redux-saga/effects";
import { getWidget } from "sagas/selectors";

// Function to retrieve highlighting information for the last row in the main canvas layout
export function* getMainCanvasLastRowHighlight() {
  // Retrieve the main canvas widget
  const mainCanvas: WidgetProps = yield select(
    getWidget,
    MAIN_CONTAINER_WIDGET_ID,
  );

  const layoutId: string = mainCanvas.layout[0].layoutId;
  const layoutOrder = [layoutId];
  const rowIndex = mainCanvas.layout[0].layout.length;

  // Return the highlighting information for the last row in the main canvas
  return {
    canvasId: MAIN_CONTAINER_WIDGET_ID,
    layoutOrder,
    rowIndex,
    posX: 0,
    posY: 0,
    alignment: FlexLayerAlignment.Start,
    dropZone: {},
    height: 0,
    width: 0,
    isVertical: false,
  };
}
