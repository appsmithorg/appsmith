import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import {
  all,
  call,
  fork,
  put,
  select,
  take,
  takeLatest,
} from "redux-saga/effects";
import {
  getWidgetIdsByType,
  getWidgetImmediateChildren,
  getWidgets,
} from "./selectors";
import { WidgetSelectionRequestPayload } from "actions/widgetSelectionActions";
import { getLastSelectedWidget, getSelectedWidgets } from "selectors/ui";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { AppState } from "@appsmith/reducers";
import { closeAllModals, showModal } from "actions/widgetActions";
import history, { NavigationMethod } from "utils/history";
import {
  getCurrentPageId,
  getIsEditorInitialized,
  snipingModeSelector,
} from "selectors/editorSelectors";
import { builderURL, widgetURL } from "RouteBuilder";
import { getCanvasWidgets, getParentModalId } from "selectors/entitiesSelector";
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
import { inGuidedTour } from "selectors/onboardingSelectors";
import { flashElementsById, quickScrollToWidget } from "utils/helpers";
import { areArraysEqual } from "utils/AppsmithUtils";

function* selectWidgetSaga(action: ReduxAction<WidgetSelectionRequestPayload>) {
  try {
    const { payload = [], selectionRequestType, invokedBy } = action.payload;

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

    switch (selectionRequestType) {
      case SelectionRequestType.Empty: {
        newSelection = [];
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

    if (parentId && newSelection.length === 1) {
      yield call(setWidgetAncestry, parentId, allWidgets);
    }
    if (!areArraysEqual([...newSelection], [...selectedWidgets])) {
      yield call(appendSelectedWidgetToUrlSaga, newSelection, invokedBy);
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

/**
 * Append Selected widgetId as hash to the url path
 * @param selectedWidgets
 * @param invokedBy
 */
function* appendSelectedWidgetToUrlSaga(
  selectedWidgets: string[],
  invokedBy?: NavigationMethod,
) {
  const guidedTourEnabled: boolean = yield select(inGuidedTour);
  const isSnipingMode: boolean = yield select(snipingModeSelector);
  if (guidedTourEnabled || isSnipingMode) return;
  const { pathname } = window.location;
  const currentPageId: string = yield select(getCurrentPageId);
  const currentURL = pathname;
  const newUrl = selectedWidgets.length
    ? widgetURL({
        pageId: currentPageId,
        persistExistingParams: true,
        selectedWidgets,
      })
    : builderURL({
        pageId: currentPageId,
        persistExistingParams: true,
      });
  if (currentURL !== newUrl) {
    history.push(newUrl, { invokedBy });
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

function* openOrCloseModalSaga(action: ReduxAction<{ widgetIds: string[] }>) {
  if (action.payload.widgetIds.length !== 1) return;

  const isEditorInitialized: boolean = yield select(getIsEditorInitialized);
  if (!isEditorInitialized) {
    yield take(ReduxActionTypes.INITIALIZE_EDITOR_SUCCESS);
  }

  const selectedWidget = action.payload.widgetIds[0];

  const modalWidgetIds: string[] = yield select(
    getWidgetIdsByType,
    "MODAL_WIDGET",
  );

  const widgetIsModal = modalWidgetIds.includes(selectedWidget);

  if (widgetIsModal) {
    yield put(showModal(selectedWidget));
    return;
  }

  const widgetMap: CanvasWidgetsReduxState = yield select(getWidgets);
  const widget = widgetMap[selectedWidget];

  if (widget && widget.parentId) {
    const parentModalId = getParentModalId(widget, widgetMap);
    const widgetInModal = modalWidgetIds.includes(parentModalId);
    if (widgetInModal) {
      yield put(showModal(parentModalId));
      return;
    }
  }

  yield put(closeAllModals());
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
    setTimeout(() => {
      // Scrolling will hide some part of the content at the top during guided tour. To avoid that
      // we skip scrolling altogether during guided tour as we don't have
      // too many widgets during the same
      flashElementsById(widgetId);
      quickScrollToWidget(widgetId, allWidgets);
    }, 0);
  }
}

export function* widgetSelectionSagas() {
  yield all([
    takeLatest(ReduxActionTypes.SELECT_WIDGET_INIT, selectWidgetSaga),
    takeLatest(
      ReduxActionTypes.SET_SELECTED_WIDGETS,
      canPerformSelectionSaga,
      openOrCloseModalSaga,
    ),
    takeLatest(ReduxActionTypes.SET_SELECTED_WIDGETS, focusOnWidgetSaga),
  ]);
}
