import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
  ReduxAction,
} from "../constants/ReduxActionConstants";
import {
  WidgetAddChild,
  WidgetResize,
  WidgetMove,
  WidgetDelete,
} from "../actions/pageActions";
import { FlattenedWidgetProps } from "../reducers/entityReducers/canvasWidgetsReducer";
import { getWidgets, getWidget, getDefaultWidgetConfig } from "./selectors";
import {
  generateWidgetProps,
  updateWidgetPosition,
} from "../utils/WidgetPropsUtils";
import { put, select, takeEvery, takeLatest, all } from "redux-saga/effects";
import { getNextWidgetName } from "../utils/AppsmithUtils";
import { UpdateWidgetPropertyPayload } from "../actions/controlActions";
import { isDynamicValue } from "../utils/DynamicBindingUtils";
import { WidgetProps } from "../widgets/BaseWidget";
import _ from "lodash";

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
    } = addChildAction.payload;
    const widget: FlattenedWidgetProps = yield select(getWidget, widgetId);
    const widgets = yield select(getWidgets);
    const defaultWidgetConfig = yield select(getDefaultWidgetConfig, type);
    const childWidget = generateWidgetProps(
      widget,
      type,
      leftColumn,
      topRow,
      columns,
      rows,
      parentRowSpace,
      parentColumnSpace,
      getNextWidgetName(defaultWidgetConfig.widgetName, widgets),
      defaultWidgetConfig,
    );
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
    widget = updateWidgetPosition(widget, leftColumn, topRow, parent);
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
  if (!isDynamic && propertyName in dynamicBindings) {
    dynamicBindings = _.omit(dynamicBindings, propertyName);
  }
  if (isDynamic && !(propertyName in dynamicBindings)) {
    dynamicBindings[propertyName] = true;
  }
  yield put({
    type: ReduxActionTypes.UPDATE_WIDGET_PROPERTY,
    payload: { ...updateAction.payload, dynamicBindings },
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
