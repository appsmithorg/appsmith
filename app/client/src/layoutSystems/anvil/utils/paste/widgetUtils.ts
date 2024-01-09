import type { AnvilHighlightInfo } from "../anvilTypes";
import { call } from "redux-saga/effects";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import {
  addNewWidgetToDsl,
  getCreateWidgetPayload,
} from "../widgetAdditionUtils";
import { addWidgetsToPreset } from "../layouts/update/additionUtils";

export function* addNewWidgetToParent(
  allWidgets: CanvasWidgetsReduxState,
  widgetId: string,
  type: string,
  parentId: string,
) {
  let updatedWidgets: CanvasWidgetsReduxState = { ...allWidgets };

  updatedWidgets = yield call(
    addNewWidgetToDsl,
    updatedWidgets,
    getCreateWidgetPayload(widgetId, type, parentId),
  );

  return updatedWidgets;
}

export function* addNewWidgetAndUpdateLayout(
  allWidgets: CanvasWidgetsReduxState,
  widgetId: string,
  type: string,
  parentId: string,
  highlight: AnvilHighlightInfo,
) {
  let updatedWidgets: CanvasWidgetsReduxState = { ...allWidgets };

  updatedWidgets = yield call(
    addNewWidgetToParent,
    allWidgets,
    widgetId,
    type,
    parentId,
  );

  return {
    ...updatedWidgets,
    [parentId]: {
      ...updatedWidgets[parentId],
      layout: addWidgetsToPreset(updatedWidgets[parentId].layout, highlight, [
        { alignment: highlight.alignment, widgetId, widgetType: type },
      ]),
    },
  };
}
