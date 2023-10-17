import { AnvilReduxActionTypes } from "layoutSystems/anvil/integrations/actions/actionTypes";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import type { WidgetPositions } from "layoutSystems/common/types";
import { all, call, put, select, take, takeEvery } from "redux-saga/effects";
import {
  extractLayoutIdFromLayoutDOMId,
  extractWidgetId,
} from "layoutSystems/common/utils/WidgetPositionsObserver/utils";
import { CANVAS_ART_BOARD } from "constants/componentClassNameConstants";
import { positionObserver } from "layoutSystems/common/utils/WidgetPositionsObserver";
import type { AppState } from "@appsmith/reducers";

/**
 * This saga is used to read and update widget position from the the list of widgets,
 * layers and layouts received from widget positions observer
 * Widgets : When triggered by the ResizeObserver wrapping the widget
 * Layers: When triggered by the ResizeObserver wrapping the layer (Flex layers)
 * Layouts: When triggered by the ResizeObserver wrapping the layout (Layout Components)
 * @param action All the widgets, layers and layouts that have changed and currently in queue to be processed
 */
function* readAndUpdateWidgetPositions() {
  const widgetDimensions: WidgetPositions = {};

  const mainContainerDOMNode = document.getElementById(CANVAS_ART_BOARD);

  const mainContainerDOMRect = mainContainerDOMNode?.getBoundingClientRect();

  const { left = 0, top = 0 } = mainContainerDOMRect || {};

  const start = performance.now();
  const registeredLayouts = positionObserver.getRegisteredLayouts();
  const registeredWidgets = positionObserver.getRegisteredWidgets();
  for (const layoutId of Object.keys(registeredLayouts)) {
    const element: HTMLElement | null = document.getElementById(layoutId);
    const _layoutId = extractLayoutIdFromLayoutDOMId(layoutId);
    if (element) {
      const rect = element.getBoundingClientRect();
      widgetDimensions[_layoutId] = {
        left: rect.left - left,
        top: rect.top - top,
        height: rect.height,
        width: rect.width,
      };
    }
  }
  for (const widgetId of Object.keys(registeredWidgets)) {
    const element = document.getElementById(widgetId);
    const _widgetId = extractWidgetId(widgetId);
    if (element) {
      const rect = element.getBoundingClientRect();
      widgetDimensions[_widgetId] = {
        left: rect.left - left,
        top: rect.top - top,
        height: rect.height,
        width: rect.width,
      };
    }
  }
  const end = performance.now();
  console.log("### Time taken to read widget positions", end - start, "ms");
  yield put({
    type: AnvilReduxActionTypes.UPDATE_WIDGET_POSITIONS,
    payload: widgetDimensions,
  });
}

function* shouldReadPositions(saga: any, action: ReduxAction<unknown>) {
  const isCanvasResizing: boolean = yield select(
    (state: AppState) => state.ui.widgetDragResize.isAutoCanvasResizing,
  );
  if (!isCanvasResizing) {
    yield call(saga, action);
  }
}

export default function* WidgetPositionSaga() {
  yield all([
    takeEvery(
      AnvilReduxActionTypes.READ_WIDGET_POSITIONS,
      shouldReadPositions,
      readAndUpdateWidgetPositions,
    ),
    takeEvery(
      ReduxActionTypes.SET_AUTO_CANVAS_RESIZING,
      readAndUpdateWidgetPositions,
    ),
  ]);
}
