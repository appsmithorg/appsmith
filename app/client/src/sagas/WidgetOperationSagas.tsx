import {
  ReduxActionTypes,
  ReduxAction,
} from "../constants/ReduxActionConstants";
import {
  WidgetAddChild,
  WidgetResize,
  WidgetMove,
  WidgetDelete,
} from "../actions/pageActions";
import { FlattenedWidgetProps } from "../reducers/entityReducers/canvasWidgetsReducer";
import { getWidgets, getWidget, getWidgetParent } from "./selectors";
import {
  generateWidgetProps,
  updateWidgetSize,
  updateWidgetPosition,
} from "../utils/WidgetPropsUtils";
import { put, select, takeEvery, takeLatest, all } from "redux-saga/effects";

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

    const childWidget = generateWidgetProps(
      widget,
      type,
      leftColumn,
      topRow,
      columns,
      rows,
      parentRowSpace,
      parentColumnSpace,
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
  } catch (err) {
    yield put({
      type: ReduxActionTypes.WIDGET_OPERATION_ERROR,
      action: ReduxActionTypes.WIDGET_ADD_CHILD,
      ...err,
    });
  }
}

export function* deleteSaga(deleteAction: ReduxAction<WidgetDelete>) {
  try {
    const { widgetId } = deleteAction.payload;
    const widgets = yield select(getWidgets);
    delete widgets[widgetId];
    const parent = yield select(getWidgetParent, widgetId);
    parent.children = parent.children.filter(
      (child: string) => child !== widgetId,
    );
    widgets[parent.widgetId] = parent;
    yield put({
      type: ReduxActionTypes.UPDATE_LAYOUT,
      payload: { widgets },
    });
  } catch (err) {
    console.log(err);
    yield put({
      type: ReduxActionTypes.WIDGET_OPERATION_ERROR,
      action: ReduxActionTypes.WIDGET_DELETE,
      ...err,
    });
  }
}

export function* moveSaga(moveAction: ReduxAction<WidgetMove>) {
  try {
    const { widgetId, leftColumn, topRow, parentWidgetId } = moveAction.payload;
    let widget: FlattenedWidgetProps = yield select(getWidget, widgetId);
    // Get all widgets from DSL/Redux Store
    const widgets = yield select(getWidgets) as any;
    // Get parent from DSL/Redux Store
    const parent = yield select(getWidgetParent, widgetId);
    // Update position of widget
    widget = updateWidgetPosition(widget, leftColumn, topRow, parent);
    // Replace widget with update widget props
    widgets[widgetId] = widget;
    // If the parent has changed i.e parentWidgetId is not parent.widgetId
    if (parent.widgetId !== parentWidgetId) {
      // Remove from the previous parent
      parent.children = parent.children.filter(
        (child: string) => child !== widgetId,
      );
      widgets[parent.widgetId] = parent;
      // Add to new parent
      widgets[parentWidgetId].children.push(widgetId);
    }
    yield put({
      type: ReduxActionTypes.UPDATE_LAYOUT,
      payload: { widgets },
    });
  } catch (err) {
    yield put({
      type: ReduxActionTypes.WIDGET_OPERATION_ERROR,
      action: ReduxActionTypes.WIDGET_MOVE,
      ...err,
    });
  }
}

export function* resizeSaga(resizeAction: ReduxAction<WidgetResize>) {
  try {
    const { widgetId, height, width } = resizeAction.payload;

    let widget: FlattenedWidgetProps = yield select(getWidget, widgetId);
    const widgets = yield select(getWidgets);

    widget = updateWidgetSize(widget, height, width);
    widgets[widgetId] = widget;

    yield put({
      type: ReduxActionTypes.UPDATE_LAYOUT,
      payload: { widgets },
    });
  } catch (err) {
    yield put({
      type: ReduxActionTypes.WIDGET_OPERATION_ERROR,
      action: ReduxActionTypes.WIDGET_RESIZE,
      ...err,
    });
  }
}

export default function* widgetOperationSagas() {
  yield all([
    takeEvery(ReduxActionTypes.WIDGET_ADD_CHILD, addChildSaga),
    takeEvery(ReduxActionTypes.WIDGET_DELETE, deleteSaga),
    takeLatest(ReduxActionTypes.WIDGET_MOVE, moveSaga),
    takeLatest(ReduxActionTypes.WIDGET_RESIZE, resizeSaga),
  ]);
}
