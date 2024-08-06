import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import type { WidgetAddChild } from "actions/pageActions";
import { WidgetReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { ENTITY_TYPE } from "ee/entities/AppsmithConsole/utils";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { call, put } from "redux-saga/effects";
import {
  type GeneratedWidgetPayload,
  generateChildWidgets,
} from "sagas/WidgetAdditionSagas";
import { traverseTreeAndExecuteBlueprintChildOperations } from "sagas/WidgetBlueprintSagas";
import AppsmithConsole from "utils/AppsmithConsole";

export function* addNewWidgetToDsl(
  allWidgets: CanvasWidgetsReduxState,
  addChildPayload: WidgetAddChild,
) {
  const { widgetId } = addChildPayload;

  const widgets = Object.assign({}, allWidgets);
  // Get the current parent widget whose child will be the new widget.
  const stateParent: FlattenedWidgetProps = allWidgets[widgetId];

  // Generate the full WidgetProps of the widget to be added.
  const childWidgetPayload: GeneratedWidgetPayload = yield generateChildWidgets(
    stateParent,
    addChildPayload,
    widgets,
    // sending blueprint for onboarding use case
    addChildPayload.props?.blueprint,
  );

  // Update widgets to put back in the canvasWidgetsReducer
  const parent = {
    ...stateParent,
    children: [...(stateParent.children || []), childWidgetPayload.widgetId],
  };

  widgets[parent.widgetId] = parent;
  AppsmithConsole.info({
    text: "Widget was created",
    source: {
      type: ENTITY_TYPE.WIDGET,
      id: childWidgetPayload.widgetId,
      name: childWidgetPayload.widgets[childWidgetPayload.widgetId].widgetName,
    },
  });
  yield put({
    type: WidgetReduxActionTypes.WIDGET_CHILD_ADDED,
    payload: {
      widgetId: childWidgetPayload.widgetId,
      type: addChildPayload.type,
    },
  });
  // some widgets need to update property of parent if the parent have CHILD_OPERATIONS
  // so here we are traversing up the tree till we get to MAIN_CONTAINER_WIDGET_ID
  // while traversing, if we find any widget which has CHILD_OPERATION, we will call the fn in it
  const updatedWidgets: CanvasWidgetsReduxState = yield call(
    traverseTreeAndExecuteBlueprintChildOperations,
    parent,
    [addChildPayload.newWidgetId],
    widgets,
  );

  return updatedWidgets;
}
