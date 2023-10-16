import { AnvilReduxActionTypes } from "layoutSystems/anvil/integrations/actions/actionTypes";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import type { WidgetPositions } from "layoutSystems/common/types";
import { all, put, takeEvery } from "redux-saga/effects";
import {
  extractLayoutIdFromLayoutDOMId,
  extractWidgetId,
  getAnvilWidgetId,
  getLayoutId,
} from "layoutSystems/common/utils/WidgetPositionsObserver/utils";
import { CANVAS_ART_BOARD } from "constants/componentClassNameConstants";
import { positionObserver } from "layoutSystems/common/utils/WidgetPositionsObserver";

/**
 * This saga is used to read and update widget position from the the list of widgets,
 * layers and layouts received from widget positions observer
 * Widgets : When triggered by the ResizeObserver wrapping the widget
 * Layers: When triggered by the ResizeObserver wrapping the layer (Flex layers)
 * Layouts: When triggered by the ResizeObserver wrapping the layout (Layout Components)
 * @param action All the widgets, layers and layouts that have changed and currently in queue to be processed
 */
function* readAndUpdateWidgetPositions(
  action: ReduxAction<{
    widgetsProcessQueue: {
      [widgetId: string]: DOMRect | boolean;
    };
    layoutsProcessQueue: { [key: string]: DOMRect | boolean };
  }>,
) {
  const { layoutsProcessQueue, widgetsProcessQueue } = action.payload;

  // const everythingToProcess = {
  //   ...layoutsProcessQueue,
  //   ...widgetsProcessQueue,
  // };

  const widgetDimensions: WidgetPositions = {};

  const mainContainerDOMNode = document.getElementById(CANVAS_ART_BOARD);

  const mainContainerDOMRect = mainContainerDOMNode?.getBoundingClientRect();

  const { left = 0, top = 0 } = mainContainerDOMRect || {};

  // for (const elementDOMId of Object.keys(everythingToProcess)) {
  //   const rect: DOMRect | boolean = everythingToProcess[elementDOMId];
  //   if (typeof rect === "object") {
  //     widgetDimensions[elementDOMId] = {
  //       left: rect.left - left,
  //       top: rect.top - top,
  //       height: rect.height,
  //       width: rect.width,
  //     };
  //   } else {
  //     const element: HTMLElement | null = document.getElementById(elementDOMId);
  //     if (element) {
  //       const rect = element.getBoundingClientRect();
  //       widgetDimensions[elementDOMId] = {
  //         left: rect.left - left,
  //         top: rect.top - top,
  //         height: rect.height,
  //         width: rect.width,
  //       };
  //     }
  //   }
  // }

  const registeredLayouts = positionObserver.getRegisteredLayouts();
  const registeredWidgets = positionObserver.getRegisteredWidgets();
  console.log("### registeredLayouts", registeredLayouts);
  console.log("### registeredWidgets", registeredWidgets);
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

  // if (Object.keys(layoutsProcessQueue).length > 0) {

  //   for (const layoutId of Object.keys(registeredLayouts)) {
  //     const element: HTMLElement | null = document.getElementById(
  //       getLayoutId(registeredLayouts[layoutId].canvasId, layoutId),
  //     );
  //     if (element) {
  //       const rect = element.getBoundingClientRect();
  //       widgetDimensions[layoutId] = {
  //         left: rect.left - left,
  //         top: rect.top - top,
  //         height: rect.height,
  //         width: rect.width,
  //       };
  //     }
  //   }
  //   for (const widgetId of Object.keys(registeredWidgets)) {
  //     const element = document.getElementById(getAnvilWidgetId(widgetId));
  //     if (element) {
  //       const rect = element.getBoundingClientRect();
  //       widgetDimensions[widgetId] = {
  //         left: rect.left - left,
  //         top: rect.top - top,
  //         height: rect.height,
  //         width: rect.width,
  //       };
  //     }
  //   }
  // } else if (Object.keys(widgetsToProcess).length > 0) {
  //   //for every affected widget get the bounding client Rect
  //   // If they do, we don't have to update the positions here.
  //   for (const widgetId of Object.keys(widgetsToProcess)) {
  //     const element = document.getElementById(getAnvilWidgetId(widgetId));
  //     if (element) {
  //       const rect = element.getBoundingClientRect();
  //       widgetDimensions[widgetId] = {
  //         left: rect.left - left,
  //         top: rect.top - top,
  //         height: rect.height,
  //         width: rect.width,
  //       };
  //     }
  //   }
  // }

  yield put({
    type: AnvilReduxActionTypes.UPDATE_WIDGET_POSITIONS,
    payload: widgetDimensions,
  });
}

export default function* WidgetPositionSaga() {
  yield all([
    takeEvery(
      AnvilReduxActionTypes.READ_WIDGET_POSITIONS,
      readAndUpdateWidgetPositions,
    ),
  ]);
}
