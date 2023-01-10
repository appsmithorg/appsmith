import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { all, call, fork, put, select, takeLatest } from "redux-saga/effects";
import {
  getWidgetIdsByType,
  getWidgetImmediateChildren,
  getWidgetMetaProps,
  getWidgets,
} from "./selectors";
import {
  SelectWidgetActionPayload,
  selectWidgetInitAction,
  setLastSelectedWidget,
  setSelectedWidgetAncestry,
  setSelectedWidgets,
} from "actions/widgetSelectionActions";
import { Toaster, Variant } from "design-system";
import {
  createMessage,
  SELECT_ALL_WIDGETS_MSG,
} from "@appsmith/constants/messages";
import { getLastSelectedWidget, getSelectedWidgets } from "selectors/ui";
import {
  CanvasWidgetsReduxState,
  FlattenedWidgetProps,
} from "reducers/entityReducers/canvasWidgetsReducer";
import { getWidgetChildrenIds } from "./WidgetOperationUtils";
import { AppState } from "@appsmith/reducers";
import { checkIsDropTarget } from "components/designSystems/appsmith/PositionedContainer";
import WidgetFactory from "utils/WidgetFactory";
import { closeAllModals, showModal } from "actions/widgetActions";
import history from "utils/history";
import { getCurrentPageId } from "selectors/editorSelectors";
import { builderURL } from "RouteBuilder";
import { CanvasWidgetsStructureReduxState } from "reducers/entityReducers/canvasWidgetsStructureReducer";
import { getParentModalId } from "selectors/entitiesSelector";
import { areArraysEqual } from "utils/AppsmithUtils";

const WidgetTypes = WidgetFactory.widgetTypes;

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
  const lastSelectedWidget: string = yield select(getLastSelectedWidget);
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
  const lastSelectedWidget: string = yield select(getLastSelectedWidget);
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
      yield put(selectWidgetInitAction(allSelectableChildren));
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

function* selectWidgetSaga(action: ReduxAction<SelectWidgetActionPayload>) {
  try {
    const { isMultiSelect, selectionRequest, selectSiblings } = action.payload;
    const newSelection: string[] = Array.isArray(selectionRequest)
      ? selectionRequest
      : [selectionRequest];
    if (
      newSelection.length === 0 ||
      !newSelection[0] ||
      newSelection[0] === ""
    ) {
      yield put(setLastSelectedWidget(""));
      yield put(setSelectedWidgets([]));
      return;
    }
    if (newSelection.some((id: string) => id === MAIN_CONTAINER_WIDGET_ID)) {
      return;
    }

    const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
    let selectedWidgets: string[] = yield select(getSelectedWidgets);
    let lastSelectedWidget: string = yield select(getLastSelectedWidget);

    if (newSelection.length === 1) {
      const widgetId = newSelection[0];

      const parentId: string | undefined = allWidgets[widgetId].parentId;

      const alreadySelected = selectedWidgets.includes(widgetId);

      const siblingWidgets: string[] = parentId
        ? yield select(getWidgetImmediateChildren, parentId)
        : [];
      const isASiblingSelected = siblingWidgets.indexOf(lastSelectedWidget);

      // Fill up the ancestry of widget
      // The following is computed to be used in the entity explorer
      // Every time a widget is selected, we need to expand widget entities
      // in the entity explorer so that the selected widget is visible
      const widgetAncestry: string[] = [];
      let ancestorWidgetId = parentId;
      while (ancestorWidgetId) {
        widgetAncestry.push(ancestorWidgetId);
        if (
          allWidgets[ancestorWidgetId] &&
          allWidgets[ancestorWidgetId].parentId
        )
          ancestorWidgetId = allWidgets[ancestorWidgetId].parentId;
        else break;
      }

      yield put(setSelectedWidgetAncestry(widgetAncestry));
      // END of widget ancestry
      if (isMultiSelect) {
        if (alreadySelected) {
          selectedWidgets = selectedWidgets.filter((each) => each !== widgetId);
        } else if (!!widgetId) {
          selectedWidgets = [...selectedWidgets, widgetId];
        }
        if (selectedWidgets.length > 0) {
          lastSelectedWidget = alreadySelected ? "" : widgetId;
        }

        // Deselect non siblings of widgets because selections are on the same level
        // Only keep current siblings selected
        selectedWidgets = selectedWidgets.filter((each) =>
          siblingWidgets.includes(each),
        );
        // End of Deselect of non siblings

        // Remove any widget that is selected that is also a parent
        selectedWidgets = selectedWidgets.filter(
          (each) => !widgetAncestry.includes(each),
        );
        // End of remove any parents
      } else {
        lastSelectedWidget = widgetId;
        if (!areArraysEqual(selectedWidgets, [widgetId])) {
          selectedWidgets = [widgetId];
        }
        // Shift select siblings Entity Explorer
        if (selectSiblings) {
          if (!alreadySelected && isASiblingSelected > -1) {
            const selectedWidgetIndex = siblingWidgets.indexOf(widgetId);
            const start =
              isASiblingSelected < selectedWidgetIndex
                ? isASiblingSelected
                : selectedWidgetIndex;
            const end =
              isASiblingSelected < selectedWidgetIndex
                ? selectedWidgetIndex
                : isASiblingSelected;
            const unSelectedSiblings = siblingWidgets.slice(start, end + 1);
            if (unSelectedSiblings && unSelectedSiblings.length) {
              selectedWidgets = [...selectedWidgets, ...unSelectedSiblings];
            }
          }
        }
        // End of shift select siblings Entity Explorer
      }
    } else {
      const widgetIds = newSelection;
      const parentToMatch = allWidgets[widgetIds[0]]?.parentId;
      const areSiblings = widgetIds.some((each) => {
        return allWidgets[each]?.parentId === parentToMatch;
      });
      if (areSiblings) {
        lastSelectedWidget = "";
        selectedWidgets = newSelection;
      }
    }

    yield put(setSelectedWidgets(selectedWidgets));
    yield put(setLastSelectedWidget(lastSelectedWidget));

    // yield put(selectWidgetAction(widgetId, isMultiSelect));
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

/**
 * Deselect widgets only if it is or inside the modal. Otherwise will not deselect any widgets.
 * @param action
 * @returns
 */
function* deselectModalWidgetSaga(
  action: ReduxAction<{
    modalId: string;
    modalWidgetChildren?: CanvasWidgetsStructureReduxState[];
  }>,
) {
  const { modalId, modalWidgetChildren } = action.payload;
  const selectedWidgets: string[] = yield select(getSelectedWidgets);
  if (selectedWidgets.length == 0) return;

  if (
    (selectedWidgets.length === 1 && selectedWidgets[0] === modalId) ||
    isWidgetPartOfChildren(selectedWidgets[0], modalWidgetChildren)
  )
    yield put(selectWidgetInitAction([]));
}

function* openOrCloseModalSaga(action: ReduxAction<{ widgetIds: string[] }>) {
  if (action.payload.widgetIds.length > 1) return;

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

/**
 * Checks if the given widgetId is part of the children recursively
 * @param widgetId
 * @param children
 * @returns
 */
function isWidgetPartOfChildren(
  widgetId: string,
  children?: CanvasWidgetsStructureReduxState[],
) {
  if (!children) return false;

  for (const child of children) {
    if (
      child.widgetId === widgetId ||
      isWidgetPartOfChildren(widgetId, child.children)
    ) {
      return true;
    }
  }

  return false;
}

export function* widgetSelectionSagas() {
  yield all([
    takeLatest(
      ReduxActionTypes.SELECT_WIDGET_INIT,
      canPerformSelectionSaga,
      selectWidgetSaga,
    ),
    takeLatest(
      ReduxActionTypes.SET_SELECTED_WIDGETS,
      canPerformSelectionSaga,
      openOrCloseModalSaga,
    ),
    takeLatest(
      ReduxActionTypes.SELECT_ALL_WIDGETS_IN_CANVAS_INIT,
      canPerformSelectionSaga,
      selectAllWidgetsInCanvasSaga,
    ),
    takeLatest(
      ReduxActionTypes.DESELECT_MODAL_WIDGETS,
      deselectModalWidgetSaga,
    ),
    takeLatest(
      ReduxActionTypes.APPEND_SELECTED_WIDGET_TO_URL,
      appendSelectedWidgetToUrlSaga,
    ),
  ]);
}
