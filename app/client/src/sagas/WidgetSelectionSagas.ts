import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { all, call, put, select, take, takeLatest } from "redux-saga/effects";
import { getWidgetImmediateChildren, getWidgets } from "./selectors";
import {
  setSelectedWidgets,
  WidgetSelectionRequestPayload,
} from "actions/widgetSelectionActions";
import { getLastSelectedWidget, getSelectedWidgets } from "selectors/ui";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import history, { NavigationMethod } from "utils/history";
import {
  getCurrentPageId,
  getIsEditorInitialized,
  snipingModeSelector,
} from "selectors/editorSelectors";
import { builderURL, widgetURL } from "RouteBuilder";
import { getAppMode, getCanvasWidgets } from "selectors/entitiesSelector";
import {
  assertParentId,
  isInvalidSelectionRequest,
  pushPopWidgetSelection,
  selectAllWidgetsInCanvasSaga,
  SelectionRequestType,
  selectMultipleWidgets,
  selectOneWidget,
  SetSelectionResult,
  setWidgetAncestry,
  shiftSelectWidgets,
  unselectWidget,
} from "sagas/WidgetSelectUtils";
import { quickScrollToWidget } from "utils/helpers";
import { areArraysEqual } from "utils/AppsmithUtils";
import { APP_MODE } from "entities/App";

// The following is computed to be used in the entity explorer
// Every time a widget is selected, we need to expand widget entities
// in the entity explorer so that the selected widget is visible
function* selectWidgetSaga(action: ReduxAction<WidgetSelectionRequestPayload>) {
  try {
    const {
      payload = [],
      selectionRequestType,
      invokedBy,
      pageId,
    } = action.payload;

    if (payload.some(isInvalidSelectionRequest)) {
      // Throw error
      return;
    }

    let newSelection: SetSelectionResult;

    const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
    const selectedWidgets: string[] = yield select(getSelectedWidgets);
    const lastSelectedWidget: string = yield select(getLastSelectedWidget);

    // It is possible that the payload is empty.
    // These properties can be used for a finding sibling widgets for certain types of selections
    const widgetId = payload[0];
    const parentId: string | undefined =
      widgetId in allWidgets ? allWidgets[widgetId].parentId : undefined;

    if (
      widgetId &&
      !allWidgets[widgetId] &&
      selectionRequestType === SelectionRequestType.One
    ) {
      return;
    }

    switch (selectionRequestType) {
      case SelectionRequestType.Empty: {
        newSelection = [];
        break;
      }
      case SelectionRequestType.UnsafeSelect: {
        newSelection = payload;
        break;
      }
      case SelectionRequestType.One: {
        assertParentId(parentId);
        newSelection = selectOneWidget(payload);
        break;
      }
      case SelectionRequestType.Multiple: {
        newSelection = selectMultipleWidgets(payload, allWidgets);
        break;
      }
      case SelectionRequestType.ShiftSelect: {
        assertParentId(parentId);
        const siblingWidgets: string[] = yield select(
          getWidgetImmediateChildren,
          parentId,
        );
        newSelection = shiftSelectWidgets(
          payload,
          siblingWidgets,
          selectedWidgets,
          lastSelectedWidget,
        );
        break;
      }
      case SelectionRequestType.PushPop: {
        assertParentId(parentId);
        const siblingWidgets: string[] = yield select(
          getWidgetImmediateChildren,
          parentId,
        );
        newSelection = pushPopWidgetSelection(
          payload,
          selectedWidgets,
          siblingWidgets,
        );
        break;
      }
      case SelectionRequestType.Unselect: {
        newSelection = unselectWidget(payload, selectedWidgets);
        break;
      }
      case SelectionRequestType.All: {
        newSelection = yield call(selectAllWidgetsInCanvasSaga);
      }
    }

    if (!newSelection) return;

    // When append selections happen, we want to ensure they all exist under the same parent
    // Selections across parents is not possible.
    if (
      [SelectionRequestType.PushPop, SelectionRequestType.ShiftSelect].includes(
        selectionRequestType,
      ) &&
      newSelection[0] in allWidgets
    ) {
      const selectionWidgetId = newSelection[0];
      const parentId = allWidgets[selectionWidgetId].parentId;
      if (parentId) {
        const selectionSiblingWidgets: string[] = yield select(
          getWidgetImmediateChildren,
          parentId,
        );
        newSelection = newSelection.filter((each) =>
          selectionSiblingWidgets.includes(each),
        );
      }
    }
    if (areArraysEqual([...newSelection], [...selectedWidgets])) {
      yield put(setSelectedWidgets(newSelection));
      return;
    }
    yield call(appendSelectedWidgetToUrlSaga, newSelection, pageId, invokedBy);
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

/**
 * Append Selected widgetId as hash to the url path
 * @param selectedWidgets
 * @param pageId
 * @param invokedBy
 */
function* appendSelectedWidgetToUrlSaga(
  selectedWidgets: string[],
  pageId?: string,
  invokedBy?: NavigationMethod,
) {
  const isSnipingMode: boolean = yield select(snipingModeSelector);
  if (isSnipingMode) return;
  const appMode: APP_MODE = yield select(getAppMode);
  const viewMode = appMode === APP_MODE.PUBLISHED;
  if (viewMode) {
    yield put(setSelectedWidgets(selectedWidgets));
    return;
  }
  const { pathname } = window.location;
  const currentPageId: string = yield select(getCurrentPageId);
  const currentURL = pathname;
  const newUrl = selectedWidgets.length
    ? widgetURL({
        pageId: pageId ?? currentPageId,
        persistExistingParams: true,
        selectedWidgets,
      })
    : builderURL({
        pageId: pageId ?? currentPageId,
        persistExistingParams: true,
      });
  if (currentURL !== newUrl) {
    history.push(newUrl, { invokedBy });
  }
}

function* handleWidgetSelectionSaga(
  action: ReduxAction<{ widgetIds: string[] }>,
) {
  const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
  yield call(setWidgetAncestry, action.payload.widgetIds[0], allWidgets);
  yield call(focusOnWidgetSaga, action);
}

function* focusOnWidgetSaga(action: ReduxAction<{ widgetIds: string[] }>) {
  if (action.payload.widgetIds.length > 1) return;
  const widgetId = action.payload.widgetIds[0];
  const isEditorInitialized: boolean = yield select(getIsEditorInitialized);
  if (!isEditorInitialized) {
    yield take(ReduxActionTypes.INITIALIZE_EDITOR_SUCCESS);
  }
  const allWidgets: CanvasWidgetsReduxState = yield select(getCanvasWidgets);
  if (widgetId) {
    quickScrollToWidget(widgetId, allWidgets);
  }
}

function* waitForInitialization(saga: any, action: ReduxAction<unknown>) {
  const isEditorInitialized: boolean = yield select(getIsEditorInitialized);
  const appMode: APP_MODE = yield select(getAppMode);
  const viewMode = appMode === APP_MODE.PUBLISHED;
  if (!isEditorInitialized && !viewMode) {
    yield take(ReduxActionTypes.INITIALIZE_EDITOR_SUCCESS);
  }
  yield call(saga, action);
}

export function* widgetSelectionSagas() {
  yield all([
    takeLatest(ReduxActionTypes.SELECT_WIDGET_INIT, selectWidgetSaga),
    takeLatest(
      ReduxActionTypes.SET_SELECTED_WIDGETS,
      waitForInitialization,
      handleWidgetSelectionSaga,
    ),
  ]);
}
