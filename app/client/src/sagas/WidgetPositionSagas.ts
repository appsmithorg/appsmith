import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import type { WidgetPositions } from "reducers/entityReducers/widgetPositionsReducer";
import { all, call, put, select, takeEvery } from "redux-saga/effects";
import { getCanvasWidgets } from "selectors/entitiesSelector";
import { getAutoWidgetId } from "utils/WidgetPositionsObserver/utils";

function* readAndUpdateWidgetPositions(
  action: ReduxAction<{
    widgetsProcessQueue: {
      [widgetId: string]: boolean;
    };
    layersProcessQueue: { [canvasId: string]: number };
  }>,
) {
  const { layersProcessQueue, widgetsProcessQueue } = action.payload;

  const affectedWidgetsFromLayers: {
    [widgetDOMId: string]: boolean;
  } = yield call(getAffectedWidgetsFromLayers, layersProcessQueue);
  const widgetsToProcess = {
    ...widgetsProcessQueue,
    ...affectedWidgetsFromLayers,
  };

  const widgetDimensions: WidgetPositions = {};

  const mainCanvasElement = document.querySelector(".flex-container-0");

  const mainRect = mainCanvasElement?.getBoundingClientRect();

  const { left = 0, top = 0 } = mainRect || {};

  for (const widgetId of Object.keys(widgetsToProcess)) {
    const element = document.getElementById(getAutoWidgetId(widgetId));
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

  yield put({
    type: ReduxActionTypes.UPDATE_WIDGET_POSITIONS,
    payload: widgetDimensions,
  });
}

function* getAffectedWidgetsFromLayers(layersProcessQueue: {
  [canvasId: string]: number;
}) {
  const widgets: CanvasWidgetsReduxState = yield select(getCanvasWidgets);

  const affectedWidgets: { [widgetDOMId: string]: boolean } = {};

  for (const [canvasId, layerIndex] of Object.entries(layersProcessQueue)) {
    const flexLayers = widgets[canvasId]?.flexLayers || [];

    for (let i = layerIndex; i < flexLayers.length; i++) {
      const children = flexLayers[i]?.children || [];
      for (const child of children) {
        affectedWidgets[child.id] = true;
      }
    }
  }

  return affectedWidgets;
}

export default function* widgetPositionSagas() {
  yield all([
    takeEvery(
      ReduxActionTypes.READ_WIDGET_POSITIONS,
      readAndUpdateWidgetPositions,
    ),
  ]);
}
