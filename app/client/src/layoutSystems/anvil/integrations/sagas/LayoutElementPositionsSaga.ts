import { AnvilReduxActionTypes } from "layoutSystems/anvil/integrations/actions/actionTypes";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import type { LayoutElementPositions } from "layoutSystems/common/types";
import { all, put, takeEvery } from "redux-saga/effects";
import {
  extractLayoutIdFromLayoutDOMId,
  getAnvilWidgetDOMId,
} from "layoutSystems/common/utils/WidgetPositionsObserver/utils";
import { CANVAS_ART_BOARD } from "constants/componentClassNameConstants";

/**
 * This saga is used to read and update widget position from the the list of widgets,
 * layers and layouts received from widget positions observer
 * Widgets : When triggered by the ResizeObserver wrapping the widget
 * Layers: When triggered by the ResizeObserver wrapping the layer (Flex layers)
 * Layouts: When triggered by the ResizeObserver wrapping the layout (Layout Components)
 * @param action All the widgets, layers and layouts that have changed and currently in queue to be processed
 */
function* readAndUpdateLayoutElementPositions(
  action: ReduxAction<{
    widgetsProcessQueue: {
      [widgetId: string]: boolean;
    };
    layoutsProcessQueue: { [key: string]: boolean };
  }>,
) {
  const { widgetsProcessQueue } = action.payload;
  const positions: LayoutElementPositions = {};
  const mainContainerDOMNode = document.getElementById(CANVAS_ART_BOARD);
  const mainContainerDOMRect = mainContainerDOMNode?.getBoundingClientRect();
  const { left = 0, top = 0 } = mainContainerDOMRect || {};

  //for every affected widget get the bounding client Rect
  // If they do, we don't have to update the positions here.
  for (const widgetId of Object.keys(widgetsProcessQueue)) {
    const element = document.getElementById(getAnvilWidgetDOMId(widgetId));
    if (element) {
      const rect = element.getBoundingClientRect();
      positions[widgetId] = {
        left: rect.left - left,
        top: rect.top - top,
        height: rect.height,
        width: rect.width,
      };
    }
  }

  for (const layoutDOMId of Object.keys(action.payload.layoutsProcessQueue)) {
    const element: HTMLElement | null = document.getElementById(layoutDOMId);
    if (element) {
      const layoutId: string = extractLayoutIdFromLayoutDOMId(layoutDOMId);
      // TODO: Fix in issue #28038
      // const layoutIndex: number =
      //   extractLayoutIndexFromLayoutDOMId(layoutDOMId);
      // const effectedLayouts = getEffectedLayouts(layoutId, layoutIndex);
      const rect = element.getBoundingClientRect();
      positions[layoutId] = {
        left: rect.left - left,
        top: rect.top - top,
        height: rect.height,
        width: rect.width,
      };
    }
  }

  yield put({
    type: AnvilReduxActionTypes.UPDATE_LAYOUT_ELEMENT_POSITIONS,
    payload: positions,
  });
}

export default function* LayoutElementPositionsSaga() {
  yield all([
    takeEvery(
      AnvilReduxActionTypes.READ_LAYOUT_ELEMENT_POSITIONS,
      readAndUpdateLayoutElementPositions,
    ),
  ]);
}
