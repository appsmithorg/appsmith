import { AnvilReduxActionTypes } from "layoutSystems/anvil/integrations/actions/actionTypes";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import type { WidgetPositions } from "layoutSystems/common/types";
import { all, call, put, select, take, takeEvery } from "redux-saga/effects";
import { getAnvilWidgetId } from "layoutSystems/common/utils/WidgetPositionsObserver/utils";
import { getAffectedWidgetsFromLayers } from "layoutSystems/anvil/integrations/utils";
import { getCanvasWidgets } from "@appsmith/selectors/entitiesSelector";
import { CANVAS_ART_BOARD } from "constants/componentClassNameConstants";
import type { AppState } from "@appsmith/reducers";

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

  const { layersProcessQueue, widgetsProcessQueue } = action.payload;

  //get additional widgets from affected layers
  const affectedWidgetsFromLayers: {
    [widgetDOMId: string]: boolean;
  } = getAffectedWidgetsFromLayers(layersProcessQueue, widgets);

  const widgetsToProcess = {
    ...widgetsProcessQueue,
    ...affectedWidgetsFromLayers,
  };

  const widgetDimensions: WidgetPositions = {};

  const mainContainerDOMNode = document.getElementById(CANVAS_ART_BOARD);

  const mainContainerDOMRect = mainContainerDOMNode?.getBoundingClientRect();

  const { left = 0, top = 0 } = mainContainerDOMRect || {};

  //for every affected widget get the bounding client Rect
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
  } else {
    yield take(
      (canvasResizingAction: any) =>
        canvasResizingAction.type ===
          ReduxActionTypes.SET_AUTO_CANVAS_RESIZING &&
        canvasResizingAction.payload === true,
    );
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
  ]);
}
