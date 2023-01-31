import {
  CanvasWidgetsReduxState,
  FlattenedWidgetProps,
} from "reducers/entityReducers/canvasWidgetsReducer";
import { uniq } from "lodash";
import { call, put, select } from "redux-saga/effects";
import { getLastSelectedWidget } from "selectors/ui";
import {
  getWidgetImmediateChildren,
  getWidgetMetaProps,
  getWidgets,
} from "sagas/selectors";
import { getWidgetChildrenIds } from "sagas/WidgetOperationUtils";
import { checkIsDropTarget } from "components/designSystems/appsmith/PositionedContainer";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import WidgetFactory from "utils/WidgetFactory";
import { setSelectedWidgetAncestry } from "actions/widgetSelectionActions";
import { Toaster, Variant } from "design-system-old";
import { createMessage, SELECT_ALL_WIDGETS_MSG } from "ce/constants/messages";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ce/constants/ReduxActionConstants";

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
}

export type SelectionPayload = string[];

export type SetSelectionResult =
  | {
      widgets: string[];
      lastWidgetSelected?: string;
    }
  | undefined;

// Main container cannot be a selection, dont honour this request
export const isInvalidSelectionRequest = (id: unknown) =>
  typeof id !== "string" || id === MAIN_CONTAINER_WIDGET_ID;

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
  return { widgets: [], lastWidgetSelected: "" };
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
  return { widgets: request, lastWidgetSelected: request[0] };
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
  return { widgets: request, lastWidgetSelected: request[0] };
};

export const shiftSelectWidgets = (
  request: SelectionPayload,
  siblingWidgets: string[],
  currentlySelectedWidgets: string[],
  lastSelectedWidget: string,
): SetSelectionResult => {
  const selectedWidgetIndex = siblingWidgets.indexOf(request[0]);
  const siblingIndexOfLastSelectedWidget = siblingWidgets.indexOf(
    lastSelectedWidget,
  );
  if (siblingIndexOfLastSelectedWidget === -1) {
    return { widgets: request, lastWidgetSelected: request[0] };
  }
  if (currentlySelectedWidgets.includes(request[0])) {
    return {
      widgets: currentlySelectedWidgets.filter((w) => request[0] !== w),
      lastWidgetSelected: "",
    };
  }
  let widgets: string[] = [...request, ...currentlySelectedWidgets];
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
  return { widgets: uniq(widgets), lastWidgetSelected: widgets[0] };
};

export const pushPopWidgetSelection = (
  request: SelectionPayload,
  currentlySelectedWidgets: string[],
  siblingWidgets: string[],
): SetSelectionResult => {
  const widgetId = request[0];
  const alreadySelected = currentlySelectedWidgets.includes(widgetId);

  if (alreadySelected) {
    return {
      lastWidgetSelected: "",
      widgets: currentlySelectedWidgets.filter((each) => each !== widgetId),
    };
  } else if (!!widgetId) {
    const widgets = [...currentlySelectedWidgets, widgetId].filter((w) =>
      siblingWidgets.includes(w),
    );
    return {
      widgets,
      lastWidgetSelected: widgetId,
    };
  }
};

export const unselectWidget = (
  request: SelectionPayload,
  currentlySelectedWidgets: string[],
): SetSelectionResult => {
  const widgets = currentlySelectedWidgets.filter((w) => !request.includes(w));
  return {
    widgets,
    lastWidgetSelected: widgets[0],
  };
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

export function* setWidgetAncestry(
  parentId: string,
  allWidgets: CanvasWidgetsReduxState,
) {
  // Fill up the ancestry of widget
  // The following is computed to be used in the entity explorer
  // Every time a widget is selected, we need to expand widget entities
  // in the entity explorer so that the selected widget is visible
  const widgetAncestry: string[] = [];
  let ancestorWidgetId = parentId;
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
  yield put(setSelectedWidgetAncestry(widgetAncestry));
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
        Toaster.show({
          text: createMessage(SELECT_ALL_WIDGETS_MSG),
          variant: Variant.info,
          duration: 3000,
        });
      }
      return {
        widgets: allSelectableChildren,
        lastWidgetSelected: allSelectableChildren[0],
      };
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
