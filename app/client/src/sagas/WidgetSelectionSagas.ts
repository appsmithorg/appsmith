import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { all, call, fork, put, select, takeLatest } from "redux-saga/effects";
import {
  getWidgetImmediateChildren,
  getWidgetMetaProps,
  getWidgets,
} from "./selectors";
import log from "loglevel";
import {
  deselectMultipleWidgetsAction,
  selectMultipleWidgetsAction,
  selectWidgetAction,
  selectWidgetInitAction,
  silentAddSelectionsAction,
} from "actions/widgetSelectionActions";
import { Toaster } from "components/ads/Toast";
import {
  createMessage,
  SELECT_ALL_WIDGETS_MSG,
} from "@appsmith/constants/messages";
import { Variant } from "components/ads/common";
import { getSelectedWidget, getSelectedWidgets } from "selectors/ui";
import {
  CanvasWidgetsReduxState,
  FlattenedWidgetProps,
} from "reducers/entityReducers/canvasWidgetsReducer";
import { getWidgetChildrenIds } from "./WidgetOperationUtils";
import { AppState } from "reducers";
import { checkIsDropTarget } from "components/designSystems/appsmith/PositionedContainer";
import WidgetFactory from "utils/WidgetFactory";
import { showModal } from "actions/widgetActions";
const WidgetTypes = WidgetFactory.widgetTypes;
// The following is computed to be used in the entity explorer
// Every time a widget is selected, we need to expand widget entities
// in the entity explorer so that the selected widget is visible
function* selectedWidgetAncestrySaga(
  action: ReduxAction<{ widgetId: string; isMultiSelect: boolean }>,
) {
  try {
    const canvasWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
    const widgetIdsExpandList = [];
    const { isMultiSelect, widgetId: selectedWidget } = action.payload;

    // Make sure that the selected widget exists in canvasWidgets
    let widgetId = canvasWidgets[selectedWidget]
      ? canvasWidgets[selectedWidget].parentId
      : undefined;
    // If there is a parentId for the selectedWidget
    if (widgetId) {
      // Keep including the parent until we reach the main container
      while (widgetId && widgetId !== MAIN_CONTAINER_WIDGET_ID) {
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

function* getDroppingCanvasOfWidget(widgetLastSelected: FlattenedWidgetProps) {
  if (checkIsDropTarget(widgetLastSelected.type)) {
    const canvasWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
    const childWidgets: string[] = yield select(
      getWidgetImmediateChildren,
      widgetLastSelected.widgetId,
    );
    const firstCanvas = childWidgets.find((each) => {
      const widget = canvasWidgets[each];
      return widget.type === WidgetTypes.CANVAS_WIDGET;
    });
    if (widgetLastSelected.type === WidgetTypes.TABS_WIDGET) {
      const tabMetaProps: Record<string, unknown> = yield select(
        getWidgetMetaProps,
        widgetLastSelected.widgetId,
      );
      return tabMetaProps.selectedTabWidgetId;
    }
    if (firstCanvas) {
      return firstCanvas;
    }
  }
  return widgetLastSelected.parentId;
}

function* getLastSelectedCanvas() {
  const lastSelectedWidget: string = yield select(getSelectedWidget);
  const canvasWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
  const widgetLastSelected =
    lastSelectedWidget && canvasWidgets[lastSelectedWidget];
  if (widgetLastSelected) {
    const canvasToSelect: string = yield call(
      getDroppingCanvasOfWidget,
      widgetLastSelected,
    );
    return canvasToSelect ? canvasToSelect : MAIN_CONTAINER_WIDGET_ID;
  }
  return MAIN_CONTAINER_WIDGET_ID;
}

// used for List widget cases
const isChildOfDropDisabledCanvas = (
  canvasWidgets: CanvasWidgetsReduxState,
  widgetId: string,
) => {
  const widget = canvasWidgets[widgetId];
  const parentId = widget.parentId || MAIN_CONTAINER_WIDGET_ID;
  const parent = canvasWidgets[parentId];
  return !!parent?.dropDisabled;
};

function* getAllSelectableChildren() {
  const lastSelectedWidget: string = yield select(getSelectedWidget);
  const canvasWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
  const widgetLastSelected = canvasWidgets[lastSelectedWidget];
  const canvasId: string = yield call(getLastSelectedCanvas);
  let allChildren: string[] = [];
  const selectGrandChildren: boolean = lastSelectedWidget
    ? widgetLastSelected && widgetLastSelected.type === WidgetTypes.LIST_WIDGET
    : false;
  if (selectGrandChildren) {
    allChildren = yield call(
      getWidgetChildrenIds,
      canvasWidgets,
      lastSelectedWidget,
    );
  } else {
    allChildren = yield select(getWidgetImmediateChildren, canvasId);
  }
  if (allChildren && allChildren.length) {
    const selectableChildren = allChildren.filter((each) => {
      const isCanvasWidget =
        each &&
        canvasWidgets[each] &&
        canvasWidgets[each].type === WidgetTypes.CANVAS_WIDGET;
      const isImmovableWidget = isChildOfDropDisabledCanvas(
        canvasWidgets,
        each,
      );
      return !(isCanvasWidget || isImmovableWidget);
    });
    return selectableChildren;
  }
  return [];
}

function* selectAllWidgetsInCanvasSaga() {
  try {
    const canvasWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
    const allSelectableChildren: string[] = yield call(
      getAllSelectableChildren,
    );
    if (allSelectableChildren && allSelectableChildren.length) {
      yield put(selectMultipleWidgetsAction(allSelectableChildren));
      const isAnyModalSelected = allSelectableChildren.some((each) => {
        return (
          each &&
          canvasWidgets[each] &&
          canvasWidgets[each].type === WidgetTypes.MODAL_WIDGET
        );
      });
      if (isAnyModalSelected) {
        Toaster.show({
          text: createMessage(SELECT_ALL_WIDGETS_MSG),
          variant: Variant.info,
          duration: 3000,
        });
      }
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.WIDGET_SELECTION_ERROR,
      payload: {
        action: ReduxActionTypes.SELECT_ALL_WIDGETS_IN_CANVAS_INIT,
        error,
      },
    });
  }
}

function* deselectNonSiblingsOfWidgetSaga(
  action: ReduxAction<{ widgetId: string; isMultiSelect: boolean }>,
) {
  try {
    const { isMultiSelect, widgetId } = action.payload;
    if (isMultiSelect) {
      const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
      const parentId: any = allWidgets[widgetId].parentId;
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
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.WIDGET_SELECTION_ERROR,
      payload: {
        action: ReduxActionTypes.SELECT_WIDGET_INIT,
        error,
      },
    });
  }
}

function* selectWidgetSaga(
  action: ReduxAction<{ widgetId: string; isMultiSelect: boolean }>,
) {
  try {
    const { isMultiSelect, widgetId } = action.payload;
    yield put(selectWidgetAction(widgetId, isMultiSelect));
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.WIDGET_SELECTION_ERROR,
      payload: {
        action: ReduxActionTypes.SELECT_WIDGET_INIT,
        error,
      },
    });
  }
}

function* shiftSelectWidgetsSaga(
  action: ReduxAction<{ widgetId: string; siblingWidgets: string[] }>,
) {
  try {
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
        yield put(silentAddSelectionsAction(unSelectedSiblings));
      }
    }
    yield put(selectWidgetInitAction(widgetId, true));
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.WIDGET_SELECTION_ERROR,
      payload: {
        action: ReduxActionTypes.SHIFT_SELECT_WIDGET_INIT,
        error,
      },
    });
  }
}

function* selectMultipleWidgetsSaga(
  action: ReduxAction<{ widgetIds: string[] }>,
) {
  try {
    const { widgetIds } = action.payload;
    if (!widgetIds || !widgetIds.length) {
      return;
    }
    const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
    const parentToMatch = allWidgets[widgetIds[0]].parentId;
    const doesNotMatchParent = widgetIds.some((each) => {
      return allWidgets[each].parentId !== parentToMatch;
    });
    if (doesNotMatchParent) {
      return;
    } else if (
      widgetIds.length === 1 &&
      allWidgets[widgetIds[0]]?.type === "MODAL_WIDGET"
    ) {
      yield put(showModal(widgetIds[0]));
    } else {
      yield put(selectWidgetAction());
      yield put(selectMultipleWidgetsAction(widgetIds));
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.WIDGET_SELECTION_ERROR,
      payload: {
        action: ReduxActionTypes.SELECT_MULTIPLE_WIDGETS_INIT,
        error,
      },
    });
  }
}

function* canPerformSelectionSaga(saga: any, action: any) {
  const isDragging: boolean = yield select(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );
  if (!isDragging) {
    yield fork(saga, action);
  }
}

function* deselectAllWidgetsSaga() {
  yield put(selectMultipleWidgetsAction([]));
}

export function* widgetSelectionSagas() {
  yield all([
    takeLatest(
      ReduxActionTypes.SHIFT_SELECT_WIDGET_INIT,
      canPerformSelectionSaga,
      shiftSelectWidgetsSaga,
    ),
    takeLatest(
      ReduxActionTypes.SELECT_WIDGET_INIT,
      canPerformSelectionSaga,
      selectWidgetSaga,
    ),
    takeLatest(
      ReduxActionTypes.SELECT_WIDGET_INIT,
      canPerformSelectionSaga,
      selectedWidgetAncestrySaga,
    ),
    takeLatest(
      ReduxActionTypes.SELECT_WIDGET_INIT,
      canPerformSelectionSaga,
      deselectNonSiblingsOfWidgetSaga,
    ),
    takeLatest(
      ReduxActionTypes.SELECT_ALL_WIDGETS_IN_CANVAS_INIT,
      canPerformSelectionSaga,
      selectAllWidgetsInCanvasSaga,
    ),
    takeLatest(
      ReduxActionTypes.SELECT_MULTIPLE_WIDGETS_INIT,
      canPerformSelectionSaga,
      selectMultipleWidgetsSaga,
    ),
    takeLatest(
      ReduxActionTypes.DESELECT_MULTIPLE_WIDGETS_INIT,
      canPerformSelectionSaga,
      deselectAllWidgetsSaga,
    ),
  ]);
}
