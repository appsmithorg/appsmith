import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { uniq } from "lodash";

export enum SelectionRequestType {
  EMPTY = "EMPTY",
  ONE = "ONE",
  MULTIPLE = "MULTIPLE",
  APPEND = "APPEND",
  REMOVE = "REMOVE",
  ALL = "ALL",
  SHIFT_SELECT = "SHIFT_SELECT",
}

export type SelectionPayload = string[];

export type SetSelectionResult =
  | {
      widgets: string[];
      lastWidgetSelected?: string;
    }
  | undefined;

export class WidgetSelectionError extends Error {
  request: SelectionPayload;
  type: SelectionRequestType;

  constructor(
    message: string,
    request: SelectionPayload,
    type: SelectionRequestType,
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
      SelectionRequestType.EMPTY,
    );
  }
  return { widgets: [], lastWidgetSelected: "" };
};

export const selectOneWidget = (
  request: SelectionPayload,
): SetSelectionResult => {
  if (request.length > 1) {
    throw new WidgetSelectionError(
      "Wrong payload supplied",
      request,
      SelectionRequestType.ONE,
    );
  }
  return { widgets: request, lastWidgetSelected: request[0] };
};

export const selectMultipleWidgets = (
  request: SelectionPayload,
  allWidgets: CanvasWidgetsReduxState,
): SetSelectionResult => {
  const parentToMatch = allWidgets[request[0]]?.parentId;
  const areSiblings = request.some((each) => {
    return allWidgets[each]?.parentId === parentToMatch;
  });
  if (!areSiblings) return;
  let newLastSelectedWidget = "";
  if (request.length === 1) {
    newLastSelectedWidget = request[0];
  }
  return { widgets: request, lastWidgetSelected: newLastSelectedWidget };
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

export const appendSelectWidget = (
  request: SelectionPayload,
  currentlySelectedWidgets: string[],
): SetSelectionResult => {
  const widgetId = request[0];
  const alreadySelected = currentlySelectedWidgets.includes(widgetId);

  if (alreadySelected) {
    return {
      lastWidgetSelected: alreadySelected ? "" : widgetId,
      widgets: currentlySelectedWidgets.filter((each) => each !== widgetId),
    };
  } else if (!!widgetId) {
    return { widgets: [...currentlySelectedWidgets, widgetId] };
  }
};
