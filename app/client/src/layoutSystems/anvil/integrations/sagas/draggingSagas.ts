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
import { getWidgets } from "sagas/selectors";
import type { AnvilHighlightInfo } from "../../utils/anvilTypes";
import { addWidgetsToPreset } from "../../utils/layouts/update/additionUtils";
import { moveWidgets } from "../../utils/layouts/update/moveUtils";
import { AnvilReduxActionTypes } from "../actions/actionTypes";
import { generateDefaultLayoutPreset } from "layoutSystems/anvil/layoutComponents/presets/DefaultLayoutPreset";

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
    };
    yield put(updateAndSaveLayout(updatedWidgets));
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
  ]);
}
