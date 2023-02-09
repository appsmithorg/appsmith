import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { all, call, fork, put, select, takeLatest } from "redux-saga/effects";
import {
  getWidgetIdsByType,
  getWidgetImmediateChildren,
  getWidgets,
} from "./selectors";
import {
  setLastSelectedWidget,
  setSelectedWidgets,
  WidgetSelectionRequestPayload,
} from "actions/widgetSelectionActions";
import { getLastSelectedWidget, getSelectedWidgets } from "selectors/ui";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { AppState } from "@appsmith/reducers";
import { closeAllModals, showModal } from "actions/widgetActions";
import history from "utils/history";
import { getCurrentPageId } from "selectors/editorSelectors";
import { builderURL } from "RouteBuilder";
import { getParentModalId } from "selectors/entitiesSelector";
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
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { areArraysEqual } from "utils/AppsmithUtils";
// The following is computed to be used in the entity explorer
// Every time a widget is selected, we need to expand widget entities
// in the entity explorer so that the selected widget is visible
function* selectWidgetSaga(action: ReduxAction<WidgetSelectionRequestPayload>) {
  try {
    const { payload = [], selectionRequestType } = action.payload;

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
        newSelection = {
          widgets: [],
          lastWidgetSelected: MAIN_CONTAINER_WIDGET_ID,
        };
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
      newSelection.widgets[0] in allWidgets
    ) {
      const selectionWidgetId = newSelection.widgets[0];
      const parentId = allWidgets[selectionWidgetId].parentId;
      if (parentId) {
        const selectionSiblingWidgets: string[] = yield select(
          getWidgetImmediateChildren,
          parentId,
        );
        newSelection.widgets = newSelection.widgets.filter((each) =>
          selectionSiblingWidgets.includes(each),
        );
      }
    }
    if (!areArraysEqual(newSelection.widgets, selectedWidgets)) {
      yield put(setSelectedWidgets(newSelection.widgets));
    }
    if (parentId && newSelection.widgets.length === 1) {
      yield call(setWidgetAncestry, parentId, allWidgets);
    }
    if (
      newSelection.lastWidgetSelected &&
      newSelection.lastWidgetSelected !== lastSelectedWidget
    ) {
      yield put(setLastSelectedWidget(newSelection.lastWidgetSelected));
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
 * @param action
 */
function* appendSelectedWidgetToUrlSaga(
  action: ReduxAction<{ selectedWidgets: string[] }>,
) {
  const guidedTourEnabled: boolean = yield select(inGuidedTour);
  if (guidedTourEnabled) return;
  const { hash, pathname } = window.location;
  const { selectedWidgets } = action.payload;
  const currentPageId: string = yield select(getCurrentPageId);

  const currentURL = hash ? `${pathname}${hash}` : pathname;
  let canvasEditorURL;
  if (selectedWidgets.length === 1) {
    canvasEditorURL = `${builderURL({
      pageId: currentPageId,
      hash: selectedWidgets[0],
      persistExistingParams: true,
    })}`;
  } else {
    canvasEditorURL = `${builderURL({
      pageId: currentPageId,
      persistExistingParams: true,
    })}`;
  }

  if (currentURL !== canvasEditorURL) {
    history.replace(canvasEditorURL);
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

export function* widgetSelectionSagas() {
  yield all([
    takeLatest(ReduxActionTypes.SELECT_WIDGET_INIT, selectWidgetSaga),
    takeLatest(
      ReduxActionTypes.SET_SELECTED_WIDGETS,
      canPerformSelectionSaga,
      openOrCloseModalSaga,
    ),
    takeLatest(
      ReduxActionTypes.APPEND_SELECTED_WIDGET_TO_URL,
      canPerformSelectionSaga,
      appendSelectedWidgetToUrlSaga,
    ),
  ]);
}
