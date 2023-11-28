import {
  type ReduxAction,
  ReduxActionErrorTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { BlueprintOperationTypes } from "WidgetProvider/constants";
import { updateAndSaveLayout } from "actions/pageActions";
import log from "loglevel";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { all, call, put, select, takeLatest } from "redux-saga/effects";
import { getUpdateDslAfterCreatingChild } from "sagas/WidgetAdditionSagas";
import { executeWidgetBlueprintBeforeOperations } from "sagas/WidgetBlueprintSagas";
import { getWidget, getWidgets } from "sagas/selectors";
import type { AnvilHighlightInfo } from "../../utils/anvilTypes";
import { addWidgetsToPreset } from "../../utils/layouts/update/additionUtils";
import { moveWidgets } from "../../utils/layouts/update/moveUtils";
import { AnvilReduxActionTypes } from "../actions/actionTypes";
import { generateDefaultLayoutPreset } from "layoutSystems/anvil/layoutComponents/presets/DefaultLayoutPreset";
import { selectWidgetInitAction } from "actions/widgetSelectionActions";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import {
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import type { WidgetProps } from "widgets/BaseWidget";
import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import { WDS_V2_WIDGET_MAP } from "widgets/wds/constants";

export function* getMainCanvasLastRowHighlight() {
  const mainCanvas: WidgetProps = yield select(
    getWidget,
    MAIN_CONTAINER_WIDGET_ID,
  );
  const layoutId: string = mainCanvas.layout[0].layoutId;
  const layoutOrder = [layoutId];
  const rowIndex = mainCanvas.layout[0].layout.length;
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

function* addSuggestedWidgetsAnvilSaga(
  actionPayload: ReduxAction<{
    newWidget: {
      newWidgetId: string;
      type: string;
      rows?: number;
      columns?: number;
      props: WidgetProps;
    };
  }>,
) {
  const { newWidget } = actionPayload.payload;
  const wdsEntry = Object.entries(WDS_V2_WIDGET_MAP).find(
    ([legacyType]) => legacyType === newWidget.type,
  );
  if (wdsEntry) {
    const [, wdsType] = wdsEntry;
    const newWidgetParams = {
      width: (newWidget.rows || 0 / GridDefaults.DEFAULT_GRID_COLUMNS) * 100,
      height: newWidget.columns || 0 * GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
      newWidgetId: newWidget.newWidgetId,
      parentId: MAIN_CONTAINER_WIDGET_ID,
      type: wdsType,
    };
    const mainCanvasHighLight: AnvilHighlightInfo = yield call(
      getMainCanvasLastRowHighlight,
    );
    const updatedWidgets: CanvasWidgetsReduxState = yield call(
      addNewChildToDSL,
      mainCanvasHighLight,
      newWidgetParams,
    );
    updatedWidgets[newWidgetParams.newWidgetId] = {
      ...updatedWidgets[newWidgetParams.newWidgetId],
      ...newWidget.props,
    };
    yield put(updateAndSaveLayout(updatedWidgets));
    yield put(
      selectWidgetInitAction(SelectionRequestType.One, [
        newWidgetParams.newWidgetId,
      ]),
    );
  }
}

function* addNewChildToDSL(
  highlight: AnvilHighlightInfo,
  newWidget: {
    width: number;
    height: number;
    newWidgetId: string;
    type: string;
  },
) {
  const { alignment, canvasId } = highlight;
  const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);

  // Execute Blueprint operation to update widget props before creation.
  const newParams: { [key: string]: any } = yield call(
    executeWidgetBlueprintBeforeOperations,
    BlueprintOperationTypes.UPDATE_CREATE_PARAMS_BEFORE_ADD,
    {
      parentId: canvasId,
      widgetId: newWidget.newWidgetId,
      widgets: allWidgets,
      widgetType: newWidget.type,
    },
  );
  const updatedParams: any = { ...newWidget, ...newParams };

  // Create and add widget.
  const updatedWidgetsOnAddition: CanvasWidgetsReduxState = yield call(
    getUpdateDslAfterCreatingChild,
    {
      ...updatedParams,
      widgetId: canvasId,
    },
  );

  const canvasWidget = updatedWidgetsOnAddition[canvasId];
  const canvasLayout = canvasWidget.layout
    ? canvasWidget.layout
    : generateDefaultLayoutPreset();
  /**
   * Add new widget to the children of parent canvas.
   * Also add it to parent canvas' layout.
   */
  const updatedWidgets = {
    ...updatedWidgetsOnAddition,
    [canvasWidget.widgetId]: {
      ...canvasWidget,
      layout: addWidgetsToPreset(canvasLayout, highlight, [
        {
          widgetId: newWidget.newWidgetId,
          alignment,
        },
      ]),
    },
    [newWidget.newWidgetId]: {
      ...updatedWidgetsOnAddition[newWidget.newWidgetId],
      // This is a temp fix, widget dimensions will be self computed by widgets
      height: newWidget.height,
      width: newWidget.width,
    },
  };
  return updatedWidgets;
}

function* addWidgetsSaga(
  actionPayload: ReduxAction<{
    highlight: AnvilHighlightInfo;
    newWidget: {
      width: number;
      height: number;
      newWidgetId: string;
      type: string;
    };
  }>,
) {
  try {
    const start = performance.now();
    const { highlight, newWidget } = actionPayload.payload;

    const updatedWidgets: CanvasWidgetsReduxState = yield call(
      addNewChildToDSL,
      highlight,
      newWidget,
    );
    yield put(updateAndSaveLayout(updatedWidgets));
    yield put(
      selectWidgetInitAction(SelectionRequestType.One, [newWidget.newWidgetId]),
    );
    log.debug("Anvil : add new widget took", performance.now() - start, "ms");
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.WIDGET_OPERATION_ERROR,
      payload: {
        action: AnvilReduxActionTypes.ANVIL_ADD_NEW_WIDGET,
        error,
      },
    });
  }
}
/**
 * Remove widgets from current parents and layouts.
 * Add to new parent and layout.
 */
function* moveWidgetsSaga(
  actionPayload: ReduxAction<{
    highlight: AnvilHighlightInfo;
    movedWidgets: string[];
  }>,
) {
  try {
    const start = performance.now();
    const { highlight, movedWidgets } = actionPayload.payload;
    const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
    const updatedWidgets: CanvasWidgetsReduxState = moveWidgets(
      allWidgets,
      movedWidgets,
      highlight,
    );
    yield put(updateAndSaveLayout(updatedWidgets));
    log.debug("Anvil : moving widgets took", performance.now() - start, "ms");
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.WIDGET_OPERATION_ERROR,
      payload: {
        action: AnvilReduxActionTypes.ANVIL_MOVE_WIDGET,
        error,
      },
    });
  }
}

export default function* anvilDraggingSagas() {
  yield all([
    takeLatest(AnvilReduxActionTypes.ANVIL_ADD_NEW_WIDGET, addWidgetsSaga),
    takeLatest(AnvilReduxActionTypes.ANVIL_MOVE_WIDGET, moveWidgetsSaga),
    takeLatest(
      AnvilReduxActionTypes.ANVIL_ADD_SUGGESTED_WIDGET,
      addSuggestedWidgetsAnvilSaga,
    ),
  ]);
}
