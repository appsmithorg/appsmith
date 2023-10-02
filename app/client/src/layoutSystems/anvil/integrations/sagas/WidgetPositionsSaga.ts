import { AnvilReduxActionTypes } from "layoutSystems/anvil/integrations/actions/actionTypes";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import type { WidgetPositions } from "layoutSystems/common/types";
import { all, put, select, takeEvery } from "redux-saga/effects";
import {
  getAnvilWidgetId,
  getLayoutId,
} from "layoutSystems/common/utils/WidgetPositionsObserver/utils";
import { getAffectedWidgetsFromLayers } from "layoutSystems/anvil/integrations/utils";
import { getCanvasWidgets } from "@appsmith/selectors/entitiesSelector";
import { CANVAS_ART_BOARD } from "constants/componentClassNameConstants";

// TODO (abhinav): Figure out why the resizeObserver isn't sending the values directly,
// Why do we have to call the `getBoundingClientRect` individually for each widget.
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
      [widgetId: string]: boolean;
    };
    layersProcessQueue: { [canvasId: string]: number };
    layoutsProcessQueue: { [key: string]: boolean };
  }>,
) {
  const widgets: CanvasWidgetsReduxState = yield select(getCanvasWidgets);

  const { layersProcessQueue, layoutsProcessQueue, widgetsProcessQueue } =
    action.payload;

  //get additional widgets from affected layers
  const affectedWidgetsFromLayers: {
    [widgetDOMId: string]: boolean;
  } = getAffectedWidgetsFromLayers(layersProcessQueue, widgets);

  const widgetsToProcess = {
    ...widgetsProcessQueue,
    ...affectedWidgetsFromLayers,
  };

  const layoutsToProcess = { ...layoutsProcessQueue };

  const widgetDimensions: WidgetPositions = {};

  const mainContainerDOMNode = document.getElementById(CANVAS_ART_BOARD);

  const mainContainerDOMRect = mainContainerDOMNode?.getBoundingClientRect();

  const { left = 0, top = 0 } = mainContainerDOMRect || {};

  //for every affected widget get the bounding client Rect
  // TODO(abhinav): Understand why all widgets don't send an update individually
  // If they do, we don't have to update the positions here.
  for (const widgetId of Object.keys(widgetsToProcess)) {
    const element = document.getElementById(getAnvilWidgetId(widgetId));
    if (element) {
      const rect = element.getBoundingClientRect();
      widgetDimensions[widgetId] = {
        left: rect.left - left,
        top: rect.top - top,
        height: rect.height,
        width: rect.width,
      };
    }
  }

  //below logic will have to be modified while implementing for Layout Components
  for (const layoutId of Object.keys(layoutsToProcess)) {
    const element = document.getElementById(getLayoutId(layoutId));
    if (element) {
      const rect = element.getBoundingClientRect();
      widgetDimensions[layoutId] = {
        left: rect.left - left,
        top: rect.top - top,
        height: rect.height,
        width: rect.width,
      };
    }
  }

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
