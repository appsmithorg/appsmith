import { createMessage, SELECT_ALL_WIDGETS_MSG } from "ee/constants/messages";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { uniq } from "lodash";
import type {
  CanvasWidgetsReduxState,
  FlattenedWidgetProps,
} from "reducers/entityReducers/canvasWidgetsReducer";
import { call, put, select } from "redux-saga/effects";
import {
  getWidgetImmediateChildren,
  getWidgetMetaProps,
  getWidgets,
} from "sagas/selectors";
import { getWidgetChildrenIds } from "sagas/WidgetOperationUtils";
import { getLastSelectedWidget, getSelectedWidgets } from "selectors/ui";
import WidgetFactory from "WidgetProvider/factory";
import { toast } from "@appsmith/ads";
import { checkIsDropTarget } from "WidgetProvider/factory/helpers";

/**
 * Selection types that are possible for widget select
 *
 * It is currently used for widget selection,
 * but can be used for other types of selections like tabs
 */
export enum SelectionRequestType {
  /** Remove all selections, reset last selected widget to the main container  */
  Empty = "Empty",
  /** Replace the existing selection with a new single selection.
   * The new selection will be the last selected widget */
  One = "One",
  /** Selection that has been lead by creation of a new widget */
  Create = "Create",
  /** Replace the existing selection with a new selection of multiple widgets.
   * The new selection's first widget becomes the last selected widget
   * */
  Multiple = "Multiple",
  /** Adds or removes a widget selection. Similar to CMD/Ctrl selections,
   *  if the payload exits in the selection, it will be removed.
   *  If the payload is new, it will be added.*/
  PushPop = "PushPop",
  /** Selects all widgets in the last selected canvas */
  All = "All",
  /** Add selection like shift select where the widgets between two selections
   * are also selected. Widget order is taken from children order of the canvas */
  ShiftSelect = "ShiftSelect",
  /**
   * Unselect specific widgets */
  Unselect = "Unselect",
  /** Skip checks and just try to select. Page ID can be supplied to select a
   * widget on another page */
  UnsafeSelect = "UnsafeSelect",
}

export type SelectionPayload = string[];

export type SetSelectionResult = string[] | undefined;

// Main container cannot be a selection, dont honour this request
export const isInvalidSelectionRequest = (id: unknown) =>
  typeof id !== "string";

export class WidgetSelectionError extends Error {
  request?: SelectionPayload;
  type?: SelectionRequestType;

  constructor(
    message: string,
    request?: SelectionPayload,
    type?: SelectionRequestType,
  ) {
    super(message);
    this.request = request;
    this.type = type;
    this.name = "WidgetSelectionError";
  }
}

export const deselectAll = (request: SelectionPayload): SetSelectionResult => {
  if (request.length > 0) {
    throw new WidgetSelectionError(
      "Wrong payload supplied",
      request,
      SelectionRequestType.Empty,
    );
  }

  return [];
};

export const selectOneWidget = (
  request: SelectionPayload,
): SetSelectionResult => {
  if (request.length !== 1) {
    throw new WidgetSelectionError(
      "Wrong payload supplied",
      request,
      SelectionRequestType.One,
    );
  }

  return request;
};

export const selectMultipleWidgets = (
  request: SelectionPayload,
  allWidgets: CanvasWidgetsReduxState,
): SetSelectionResult => {
  const parentToMatch = allWidgets[request[0]]?.parentId;
  const areSiblings = request.every((each) => {
    return allWidgets[each]?.parentId === parentToMatch;
  });

  if (!areSiblings) return;

  return request;
};

export const shiftSelectWidgets = (
  request: SelectionPayload,
  siblingWidgets: string[],
  currentlySelectedWidgets: string[],
  lastSelectedWidget: string,
): SetSelectionResult => {
  const selectedWidgetIndex = siblingWidgets.indexOf(request[0]);
  const siblingIndexOfLastSelectedWidget =
    siblingWidgets.indexOf(lastSelectedWidget);

  if (siblingIndexOfLastSelectedWidget === -1) {
    return request;
  }

  if (currentlySelectedWidgets.includes(request[0])) {
    return currentlySelectedWidgets.filter((w) => request[0] !== w);
  }

  let widgets: string[] = [...currentlySelectedWidgets, ...request];
  const start =
    siblingIndexOfLastSelectedWidget < selectedWidgetIndex
      ? siblingIndexOfLastSelectedWidget
      : selectedWidgetIndex;
  const end =
    siblingIndexOfLastSelectedWidget < selectedWidgetIndex
      ? selectedWidgetIndex
      : siblingIndexOfLastSelectedWidget;
  const unSelectedSiblings = siblingWidgets.slice(start, end + 1);

  if (unSelectedSiblings && unSelectedSiblings.length) {
    widgets = widgets.concat(...unSelectedSiblings);
  }

  return uniq(widgets);
};

export const pushPopWidgetSelection = (
  request: SelectionPayload,
  currentlySelectedWidgets: string[],
  siblingWidgets: string[],
): SetSelectionResult => {
  const widgetId = request[0];
  const alreadySelected = currentlySelectedWidgets.includes(widgetId);

  if (alreadySelected) {
    return currentlySelectedWidgets.filter((each) => each !== widgetId);
  } else if (!!widgetId) {
    return [...currentlySelectedWidgets, widgetId].filter((w) =>
      siblingWidgets.includes(w),
    );
  }
};

export const unselectWidget = (
  request: SelectionPayload,
  currentlySelectedWidgets: string[],
): SetSelectionResult => {
  return currentlySelectedWidgets.filter((w) => !request.includes(w));
};

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
        widgetLastSelected,
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
  const selectedWidgets: string[] = yield select(getSelectedWidgets);
  const areMultipleWidgetsSelected: boolean = selectedWidgets.length > 1;
  const canvasWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
  const widgetLastSelected =
    lastSelectedWidget && canvasWidgets[lastSelectedWidget];

  if (widgetLastSelected) {
    if (areMultipleWidgetsSelected) {
      return widgetLastSelected.parentId || MAIN_CONTAINER_WIDGET_ID;
    }

    if (!areMultipleWidgetsSelected) {
      const canvasToSelect: string = yield call(
        getDroppingCanvasOfWidget,
        widgetLastSelected,
      );

      return canvasToSelect ? canvasToSelect : MAIN_CONTAINER_WIDGET_ID;
    }
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

export function* getAllSelectableChildren() {
  const lastSelectedWidget: string = yield select(getLastSelectedWidget);
  const canvasWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
  const widgetLastSelected = canvasWidgets[lastSelectedWidget];
  const canvasId: string = yield call(getLastSelectedCanvas);
  let allChildren: string[];
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
    return allChildren.filter((each) => {
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
  }

  return [];
}

export function assertParentId(parentId: unknown): asserts parentId is string {
  if (!parentId || typeof parentId !== "string") {
    throw new WidgetSelectionError("Could not find a parent for the widget");
  }
}

export function getWidgetAncestry(
  widgetId: string | undefined,
  allWidgets: CanvasWidgetsReduxState,
) {
  // Fill up the ancestry of widget
  // The following is computed to be used in the entity explorer
  // Every time a widget is selected, we need to expand widget entities
  // in the entity explorer so that the selected widget is visible
  // It is also used for finding the selected widget ancestry so that we can
  // show widgets that could be invisible in the current state like widgets inside
  // hidden tabs
  const widgetAncestry: string[] = [];
  let ancestorWidgetId = widgetId;

  while (ancestorWidgetId) {
    widgetAncestry.push(ancestorWidgetId);

    if (allWidgets[ancestorWidgetId] && allWidgets[ancestorWidgetId].parentId) {
      const parentId = allWidgets[ancestorWidgetId].parentId;

      assertParentId(parentId);
      ancestorWidgetId = parentId;
    } else {
      break;
    }
  }

  return widgetAncestry;
}

export function* selectAllWidgetsInCanvasSaga() {
  try {
    const canvasWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
    const allSelectableChildren: string[] = yield call(
      getAllSelectableChildren,
    );

    if (allSelectableChildren && allSelectableChildren.length) {
      const isAnyModalSelected = allSelectableChildren.some((each) => {
        return (
          each &&
          canvasWidgets[each] &&
          canvasWidgets[each].type === WidgetFactory.widgetTypes.MODAL_WIDGET
        );
      });

      if (isAnyModalSelected) {
        toast.show(createMessage(SELECT_ALL_WIDGETS_MSG), {
          kind: "info",
        });
      }

      return allSelectableChildren;
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
