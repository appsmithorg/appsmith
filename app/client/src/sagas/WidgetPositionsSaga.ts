import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import type { WidgetPositions } from "reducers/entityReducers/widgetPositionsReducer";
import { all, put, select, takeEvery } from "redux-saga/effects";
import {
  getAnvilWidgetId,
  getLayoutId,
} from "utils/WidgetPositionsObserver/utils";
import { getAffectedWidgetsFromLayers } from "./WidgetPositionsUtils";
import { getCanvasWidgets } from "@appsmith/selectors/entitiesSelector";
import { CANVAS_ART_BOARD } from "constants/componentClassNameConstants";

/**
 * This saga is used to read and update widget position from the the list of widgets,
 * layers and layouts received from widget positions observer
 * @param action
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

  const mainCanvasElement = document.querySelector(`.${CANVAS_ART_BOARD}`);

  const mainRect = mainCanvasElement?.getBoundingClientRect();

  const { left = 0, top = 0 } = mainRect || {};

  //for every affected widget get the bounding client Rect
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
    type: ReduxActionTypes.UPDATE_WIDGET_POSITIONS,
    payload: widgetDimensions,
  });
}

export default function* WidgetPositionSaga() {
  yield all([
    takeEvery(
      ReduxActionTypes.READ_WIDGET_POSITIONS,
      readAndUpdateWidgetPositions,
    ),
  ]);
}
