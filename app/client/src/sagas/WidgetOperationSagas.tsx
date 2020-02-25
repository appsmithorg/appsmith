import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
  ReduxAction,
} from "constants/ReduxActionConstants";
import {
  WidgetAddChild,
  WidgetResize,
  WidgetMove,
  WidgetDelete,
} from "actions/pageActions";
import { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsReducer";
import { getWidgets, getWidget, getDefaultWidgetConfig } from "./selectors";
import {
  generateWidgetProps,
  updateWidgetPosition,
} from "utils/WidgetPropsUtils";
import { put, select, takeEvery, takeLatest, all } from "redux-saga/effects";
import { getNextEntityName } from "utils/AppsmithUtils";
import { UpdateWidgetPropertyPayload } from "actions/controlActions";
import { isDynamicValue } from "utils/DynamicBindingUtils";
import { WidgetProps } from "widgets/BaseWidget";
import _ from "lodash";
import { WidgetTypes } from "constants/WidgetConstants";
import WidgetFactory from "utils/WidgetFactory";

export function* addChildSaga(addChildAction: ReduxAction<WidgetAddChild>) {
  try {
    const {
      widgetId,
      type,
      leftColumn,
      topRow,
      columns,
      rows,
      parentRowSpace,
      parentColumnSpace,
      newWidgetId,
    } = addChildAction.payload;
    const widget: FlattenedWidgetProps = yield select(getWidget, widgetId);
    const widgets = yield select(getWidgets);
    const widgetNames = Object.keys(widgets).map(w => widgets[w].widgetName);
    const defaultWidgetConfig = yield select(getDefaultWidgetConfig, type);
    const childWidget = generateWidgetProps(
      widget, // parent,
      type,
      leftColumn,
      topRow,
      columns,
      rows,
      parentRowSpace,
      parentColumnSpace,
      getNextEntityName(defaultWidgetConfig.widgetName, widgetNames),
      defaultWidgetConfig,
    );
    childWidget.widgetId = newWidgetId;
    widgets[childWidget.widgetId] = childWidget;
    if (widget && widget.children) {
      widget.children.push(childWidget.widgetId);
    }
    widgets[widgetId] = widget;
    yield put({
      type: ReduxActionTypes.UPDATE_LAYOUT,
      payload: { widgets },
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.WIDGET_OPERATION_ERROR,
      payload: {
        action: ReduxActionTypes.WIDGET_ADD_CHILD,
        error,
      },
    });
  }
}

export function* deleteSaga(deleteAction: ReduxAction<WidgetDelete>) {
  try {
    const { widgetId, parentId } = deleteAction.payload;
    const widgets = yield select(getWidgets);
    const parent = yield select(getWidget, parentId);
    parent.children = parent.children.filter(
      (child: string) => child !== widgetId,
    );
    delete widgets[widgetId];
    widgets[parentId] = parent;
    yield put({
      type: ReduxActionTypes.UPDATE_LAYOUT,
      payload: { widgets },
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.WIDGET_OPERATION_ERROR,
      payload: {
        action: ReduxActionTypes.WIDGET_DELETE,
        error,
      },
    });
  }
}

export function* moveSaga(moveAction: ReduxAction<WidgetMove>) {
  try {
    const {
      widgetId,
      leftColumn,
      topRow,
      parentId,
      newParentId,
    } = moveAction.payload;
    let widget: FlattenedWidgetProps = yield select(getWidget, widgetId);
    // Get all widgets from DSL/Redux Store
    const widgets = yield select(getWidgets) as any;
    // Get parent from DSL/Redux Store
    const parent = yield select(getWidget, parentId);
    // Update position of widget
    widget = updateWidgetPosition(widget, leftColumn, topRow);
    // Replace widget with update widget props
    widgets[widgetId] = widget;
    // If the parent has changed i.e parentWidgetId is not parent.widgetId
    if (parent.widgetId !== newParentId && widgetId !== newParentId) {
      // Remove from the previous parent
      parent.children = parent.children.filter(
        (child: string) => child !== widgetId,
      );
      widgets[parent.widgetId] = parent;
      // Add to new parent
      widgets[newParentId].children.push(widgetId);
    }
    yield put({
      type: ReduxActionTypes.UPDATE_LAYOUT,
      payload: { widgets },
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.WIDGET_OPERATION_ERROR,
      payload: {
        action: ReduxActionTypes.WIDGET_MOVE,
        error,
      },
    });
  }
}

export function* resizeSaga(resizeAction: ReduxAction<WidgetResize>) {
  try {
    const {
      widgetId,
      leftColumn,
      rightColumn,
      topRow,
      bottomRow,
    } = resizeAction.payload;

    let widget: FlattenedWidgetProps = yield select(getWidget, widgetId);
    const widgets = yield select(getWidgets);

    if (widget.type === WidgetTypes.CONTAINER_WIDGET) {
      widget.snapRows = bottomRow - topRow - 1;
    }
    widget = { ...widget, leftColumn, rightColumn, topRow, bottomRow };
    widgets[widgetId] = widget;

    yield put({
      type: ReduxActionTypes.UPDATE_LAYOUT,
      payload: { widgets },
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.WIDGET_OPERATION_ERROR,
      payload: {
        action: ReduxActionTypes.WIDGET_RESIZE,
        error,
      },
    });
  }
}

function* updateWidgetPropertySaga(
  updateAction: ReduxAction<UpdateWidgetPropertyPayload>,
) {
  const {
    payload: { propertyValue, propertyName, widgetId },
  } = updateAction;
  const isDynamic = isDynamicValue(propertyValue);
  const widget: WidgetProps = yield select(getWidget, widgetId);
  let dynamicBindings: Record<string, boolean> = widget.dynamicBindings || {};
  let dynamicTriggers: Record<string, true> = widget.dynamicTriggers || {};
  const triggerProperties = WidgetFactory.getWidgetTriggerPropertiesMap(
    widget.type,
  );
  if (propertyName in triggerProperties) {
    if (propertyValue && !(propertyName in dynamicTriggers)) {
      dynamicTriggers[propertyName] = true;
    }
    if (!propertyValue && propertyName in dynamicTriggers) {
      dynamicTriggers = _.omit(dynamicTriggers, propertyName);
    }
  } else {
    if (!isDynamic && propertyName in dynamicBindings) {
      dynamicBindings = _.omit(dynamicBindings, propertyName);
    }
    if (isDynamic && !(propertyName in dynamicBindings)) {
      dynamicBindings[propertyName] = true;
    }
  }

  yield put({
    type: ReduxActionTypes.UPDATE_WIDGET_PROPERTY,
    payload: { ...updateAction.payload, dynamicBindings, dynamicTriggers },
  });
}

export default function* widgetOperationSagas() {
  yield all([
    takeEvery(ReduxActionTypes.WIDGET_ADD_CHILD, addChildSaga),
    takeEvery(ReduxActionTypes.WIDGET_DELETE, deleteSaga),
    takeLatest(ReduxActionTypes.WIDGET_MOVE, moveSaga),
    takeLatest(ReduxActionTypes.WIDGET_RESIZE, resizeSaga),
    takeEvery(
      ReduxActionTypes.UPDATE_WIDGET_PROPERTY_REQUEST,
      updateWidgetPropertySaga,
    ),
  ]);
}
