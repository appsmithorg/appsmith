import { AnvilReduxActionTypes } from "layoutSystems/anvil/integrations/actions/actionTypes";
import type { LayoutElementPositions } from "layoutSystems/common/types";
import { all, put, select, takeEvery, takeLatest } from "redux-saga/effects";
import { extractWidgetIdFromAnvilWidgetDOMId } from "layoutSystems/common/utils/LayoutElementPositionsObserver/utils";
import { CANVAS_ART_BOARD } from "constants/componentClassNameConstants";
import { positionObserver } from "layoutSystems/common/utils/LayoutElementPositionsObserver";
import log from "loglevel";
import type { AppState } from "ee/reducers";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { APP_MODE } from "entities/App";
import { selectCombinedPreviewMode } from "selectors/gitModSelectors";
import { getAppMode } from "ee/selectors/entitiesSelector";
import type { RefObject } from "react";
import { getAnvilSpaceDistributionStatus } from "../selectors";

/**
 * In this function,
 * Get the DOM elements for the registered widgets and layouts
 * Call `getBoundingClientRect` on each of them
 * Offset the values by the MainContainer's left and top and store them as left top values in positions
 * Offset the values by their parent drop targets positions(if parent drop target exists) and store them as offsetTop offsetLeft values in positions.
 * Store the values in the `positions` object
 */
function processPositionsForLayouts(
  layoutDomId: string,
  positions: LayoutElementPositions,
  registeredLayouts: {
    [layoutDOMId: string]: {
      ref: RefObject<HTMLDivElement>;
      layoutId: string;
      canvasId: string;
      parentDropTarget: string;
      isDropTarget: boolean;
    };
  },
  mainContainerDOMRectOffsets: {
    left: number;
    top: number;
  },
) {
  const { left, top } = mainContainerDOMRectOffsets;
  const { layoutId, parentDropTarget } = registeredLayouts[layoutDomId];
  const element: HTMLElement | null = document.getElementById(layoutDomId);
  const parentPositions = positions[parentDropTarget];

  if (element) {
    const rect: DOMRect = element.getBoundingClientRect();

    positions[layoutId] = {
      left: rect.left - left,
      top: rect.top - top,
      height: rect.height,
      width: rect.width,
      ...(parentPositions
        ? {
            offsetLeft: rect.left - (parentPositions.left + left),
            offsetTop: rect.top - (parentPositions.top + top),
          }
        : {
            offsetLeft: 0,
            offsetTop: 0,
          }),
    };
  }
}

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
  const isDistributingSpace: boolean = yield select(
    getAnvilSpaceDistributionStatus,
  );

  if (isCanvasResizing || isDistributingSpace) {
    return;
  }

  // The positions are used only in the editor, so we should not be running this saga
  // in the viewer or the preview mode.
  const isPreviewMode: boolean = yield select(selectCombinedPreviewMode);
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
  const dropTargetsOrder = positionObserver.getDropTargetDomIdsOrder();

  // process drop targets positions first to capture all drop targets offset positions in order of parent to child drop target(dropTargetsOrder).
  dropTargetsOrder.forEach((eachDomId) =>
    processPositionsForLayouts(eachDomId, positions, registeredLayouts, {
      left,
      top,
    }),
  );
  // process positions for layouts wrt MainContainer as well as their parent drop target layout
  Object.keys(registeredLayouts)
    .filter((each) => !dropTargetsOrder.includes(each))
    .forEach((eachDomId) =>
      processPositionsForLayouts(eachDomId, positions, registeredLayouts, {
        left,
        top,
      }),
    );

  // process positions for widgets wrt MainContainer as well as their parent drop target layout
  for (const anvilWidgetDOMId of Object.keys(registeredWidgets)) {
    const { layoutId } = registeredWidgets[anvilWidgetDOMId];
    const parentDropTargetPositions = positions[layoutId];
    let element: HTMLElement | null = document.getElementById(anvilWidgetDOMId);

    if (!element) {
      const elements = document.getElementsByClassName(anvilWidgetDOMId);

      element = elements[0] as HTMLDivElement;
    }

    const widgetId = extractWidgetIdFromAnvilWidgetDOMId(anvilWidgetDOMId);

    if (element) {
      const rect: DOMRect = element.getBoundingClientRect();

      positions[widgetId] = {
        left: rect.left - left,
        top: rect.top - top,
        height: rect.height,
        width: rect.width,
        ...(parentDropTargetPositions
          ? {
              offsetLeft: rect.left - (parentDropTargetPositions.left + left),
              offsetTop: rect.top - (parentDropTargetPositions.top + top),
            }
          : {
              offsetLeft: 0,
              offsetTop: 0,
            }),
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
