import { AnvilReduxActionTypes } from "layoutSystems/anvil/integrations/actions/actionTypes";
import type { LayoutElementPositions } from "layoutSystems/common/types";
import { all, put, select, takeEvery, takeLatest } from "redux-saga/effects";
import {
  extractLayoutIdFromLayoutDOMId,
  extractWidgetIdFromAnvilWidgetDOMId,
} from "layoutSystems/common/utils/LayoutElementPositionsObserver/utils";
import { CANVAS_ART_BOARD } from "constants/componentClassNameConstants";
import { positionObserver } from "layoutSystems/common/utils/LayoutElementPositionsObserver";
import log from "loglevel";
import type { AppState } from "@appsmith/reducers";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { APP_MODE } from "entities/App";
import { combinedPreviewModeSelector } from "selectors/editorSelectors";
import { getAppMode } from "@appsmith/selectors/entitiesSelector";

/**
 * This saga is used to read(from DOM) and update(in reducers) the widget and layout positions
 * Every time we receive a request to execute this saga, we read the positions of
 * ALL the widgets and layouts currently on the DOM and update the reducer
 */
function* readAndUpdateLayoutElementPositions() {
  // While the user is resizing the canvas
  // Any computations that we perform will be stale
  // by the time the user stops resizing
  // So, we prevent any computations until we're done resizing
  const isCanvasResizing: boolean = yield select(
    (state: AppState) => state.ui.widgetDragResize.isAutoCanvasResizing,
  );
  if (isCanvasResizing) {
    return;
  }

  // The positions are used only in the editor, so we should not be running this saga
  // in the viewer or the preview mode.
  const isPreviewMode: boolean = yield select(combinedPreviewModeSelector);
  const appMode: APP_MODE = yield select(getAppMode);
  if (isPreviewMode || appMode === APP_MODE.PUBLISHED) {
    return;
  }

  const positions: LayoutElementPositions = {};

  // Get the MainContainer's left and top position
  // All values stored in the reducer today is relative to the MainContainer
  const mainContainerDOMNode = document.getElementById(CANVAS_ART_BOARD);
  const mainContainerDOMRect = mainContainerDOMNode?.getBoundingClientRect();
  const { left = 0, top = 0 } = mainContainerDOMRect || {};

  const start = performance.now();

  // Fetch every registered widget and layout
  // This is not the optimal mechanism to fetch the positions
  // We're essentially calling `getBoundingClientRect` on all the widgets and layouts
  // This can be very expensive
  // TODO #28164 - Optimize this
  // Approaches we can consider:
  // 1. Get all positions using a DOM API once
  // 2. Perform the computations for a limited set of widgets and layouts
  // 3. Change how we maintain positions such that the number of computations are reduced
  // 4. Use a DOM API that is more performant. We've already considered IntersectionObserver
  // However, it doesn't work in all browsers as we need the V2 trackVisibility API
  const registeredLayouts = positionObserver.getRegisteredLayouts();
  const registeredWidgets = positionObserver.getRegisteredWidgets();

  // In the following code:
  // Get the DOM elements for the registered widgets and layouts
  // Call `getBoundingClientRect` on each of them
  // Offset the values by the MainContainer's left and top
  // Store the values in the `positions` object

  // Do the above for layouts
  for (const anvilLayoutDOMId of Object.keys(registeredLayouts)) {
    const element: HTMLElement | null =
      document.getElementById(anvilLayoutDOMId);
    const layoutId = extractLayoutIdFromLayoutDOMId(anvilLayoutDOMId);
    if (element) {
      const rect: DOMRect = element.getBoundingClientRect();
      positions[layoutId] = {
        left: rect.left - left,
        top: rect.top - top,
        height: rect.height,
        width: rect.width,
      };
    }
  }

  // Do the above for widgets
  for (const anvilWidgetDOMId of Object.keys(registeredWidgets)) {
    const element: HTMLElement | null =
      document.getElementById(anvilWidgetDOMId);
    const widgetId = extractWidgetIdFromAnvilWidgetDOMId(anvilWidgetDOMId);
    if (element) {
      const rect: DOMRect = element.getBoundingClientRect();
      positions[widgetId] = {
        left: rect.left - left,
        top: rect.top - top,
        height: rect.height,
        width: rect.width,
      };
    }
  }

  const end = performance.now();
  log.debug("### Time taken to read widget positions", end - start, "ms");

  // Update the reducer with the positions
  yield put({
    type: AnvilReduxActionTypes.UPDATE_LAYOUT_ELEMENT_POSITIONS,
    payload: positions,
  });
}

export default function* LayoutElementPositionsSaga() {
  yield all([
    // This takeEvery is another angle for optimisation
    // Essentially, if we call READ_LAYOUT_ELEMENT_POSITIONS
    // multiple times, we WILL end up blocking the UI thread.
    takeEvery(
      AnvilReduxActionTypes.READ_LAYOUT_ELEMENT_POSITIONS,
      readAndUpdateLayoutElementPositions,
    ),
    // When we stop resizing the canvas, we need to update the positions
    takeLatest(
      ReduxActionTypes.SET_AUTO_CANVAS_RESIZING,
      readAndUpdateLayoutElementPositions,
    ),
  ]);
}
