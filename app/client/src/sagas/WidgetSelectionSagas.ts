import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { all, put, select, takeLatest } from "redux-saga/effects";
import { getWidgetImmediateChildren, getWidgets } from "./selectors";
import log from "loglevel";
import {
  deselectMultipleWidgetsAction,
  selectAllWidgetsAction,
  selectMultipleWidgetsAction,
  selectWidgetAction,
  selectWidgetInitAction,
} from "actions/widgetSelectionActions";
import { Toaster } from "components/ads/Toast";
import { createMessage, SELECT_ALL_WIDGETS_MSG } from "constants/messages";
import { Variant } from "components/ads/common";
import { getSelectedWidget, getSelectedWidgets } from "selectors/ui";

// The following is computed to be used in the entity explorer
// Every time a widget is selected, we need to expand widget entities
// in the entity explorer so that the selected widget is visible
function* selectedWidgetAncestrySaga(
  action: ReduxAction<{ widgetId: string; isMultiSelect: boolean }>,
) {
  try {
    const canvasWidgets = yield select(getWidgets);
    const widgetIdsExpandList = [];
    const { isMultiSelect, widgetId: selectedWidget } = action.payload;

    // Make sure that the selected widget exists in canvasWidgets
    let widgetId = canvasWidgets[selectedWidget]
      ? canvasWidgets[selectedWidget].parentId
      : undefined;
    // If there is a parentId for the selectedWidget
    if (widgetId) {
      // Keep including the parent until we reach the main container
      while (widgetId !== MAIN_CONTAINER_WIDGET_ID) {
        widgetIdsExpandList.push(widgetId);
        if (canvasWidgets[widgetId] && canvasWidgets[widgetId].parentId)
          widgetId = canvasWidgets[widgetId].parentId;
        else break;
      }
    }
    if (isMultiSelect) {
      // Deselect the parents if this is a Multi select.
      const parentsToDeselect = widgetIdsExpandList.filter(
        (each) => each !== selectedWidget,
      );
      if (parentsToDeselect && parentsToDeselect.length) {
        yield put(deselectMultipleWidgetsAction(parentsToDeselect));
      }
    }

    yield put({
      type: ReduxActionTypes.SET_SELECTED_WIDGET_ANCESTORY,
      payload: widgetIdsExpandList,
    });
  } catch (error) {
    log.debug("Could not compute selected widget's ancestry", error);
  }
}

function* selectAllWidgetsSaga() {
  const allWidgetsOnMainContainer: string[] = yield select(
    getWidgetImmediateChildren,
    MAIN_CONTAINER_WIDGET_ID,
  );
  if (allWidgetsOnMainContainer && allWidgetsOnMainContainer.length) {
    yield put(selectAllWidgetsAction(allWidgetsOnMainContainer));
    Toaster.show({
      text: createMessage(SELECT_ALL_WIDGETS_MSG),
      variant: Variant.info,
      duration: 3000,
    });
  }
}

function* deselectNonSiblingsOfWidgetSaga(
  action: ReduxAction<{ widgetId: string; isMultiSelect: boolean }>,
) {
  const { isMultiSelect, widgetId } = action.payload;
  if (isMultiSelect) {
    const allWidgets = yield select(getWidgets);
    const parentId = allWidgets[widgetId].parentId;
    const childWidgets: string[] = yield select(
      getWidgetImmediateChildren,
      parentId,
    );
    const currentSelectedWidgets: string[] = yield select(getSelectedWidgets);

    const nonSiblings = currentSelectedWidgets.filter(
      (each) => !childWidgets.includes(each),
    );
    if (nonSiblings && nonSiblings.length) {
      yield put(
        deselectMultipleWidgetsAction(
          nonSiblings.filter((each) => each !== widgetId),
        ),
      );
    }
  }
}

function* selectWidgetSaga(
  action: ReduxAction<{ widgetId: string; isMultiSelect: boolean }>,
) {
  const { isMultiSelect, widgetId } = action.payload;
  yield put(selectWidgetAction(widgetId, isMultiSelect));
}

function* shiftSelectWidgetsSaga(
  action: ReduxAction<{ widgetId: string; siblingWidgets: string[] }>,
) {
  const { siblingWidgets, widgetId } = action.payload;
  const selectedWidgets: string[] = yield select(getSelectedWidgets);
  const lastSelectedWidget: string = yield select(getSelectedWidget);
  const lastSelectedWidgetIndex = siblingWidgets.indexOf(lastSelectedWidget);
  const isWidgetSelected = selectedWidgets.includes(widgetId);
  if (!isWidgetSelected && lastSelectedWidgetIndex > -1) {
    const selectedWidgetIndex = siblingWidgets.indexOf(widgetId);
    const start =
      lastSelectedWidgetIndex < selectedWidgetIndex
        ? lastSelectedWidgetIndex
        : selectedWidgetIndex;
    const end =
      lastSelectedWidgetIndex < selectedWidgetIndex
        ? selectedWidgetIndex
        : lastSelectedWidgetIndex;
    const unSelectedSiblings = siblingWidgets.slice(start + 1, end);
    if (unSelectedSiblings && unSelectedSiblings.length) {
      yield put(selectMultipleWidgetsAction(unSelectedSiblings));
    }
  }
  yield put(selectWidgetInitAction(widgetId, true));
}

export function* widgetSelectionSagas() {
  yield all([
    takeLatest(
      ReduxActionTypes.SHIFT_SELECT_WIDGET_INIT,
      shiftSelectWidgetsSaga,
    ),
    takeLatest(ReduxActionTypes.SELECT_WIDGET_INIT, selectWidgetSaga),
    takeLatest(ReduxActionTypes.SELECT_WIDGET_INIT, selectedWidgetAncestrySaga),
    takeLatest(
      ReduxActionTypes.SELECT_WIDGET_INIT,
      deselectNonSiblingsOfWidgetSaga,
    ),
    takeLatest(
      ReduxActionTypes.SELECT_MULTIPLE_WIDGETS_INIT,
      selectAllWidgetsSaga,
    ),
  ]);
}
