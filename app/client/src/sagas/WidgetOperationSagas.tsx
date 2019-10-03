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
import {
  getWidgets,
  getWidget,
  getWidgetParent,
  getDefaultWidgetConfig,
} from "./selectors";
import {
  generateWidgetProps,
  updateWidgetPosition,
} from "../utils/WidgetPropsUtils";
import { put, select, takeEvery, takeLatest, all } from "redux-saga/effects";
import { getNextWidgetName } from "../utils/AppsmithUtils";

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
      getNextWidgetName(type, widgets),
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
    if (parent.widgetId !== parentWidgetId && widgetId !== parentWidgetId) {
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

export default function* widgetOperationSagas() {
  yield all([
    takeEvery(ReduxActionTypes.WIDGET_ADD_CHILD, addChildSaga),
    takeEvery(ReduxActionTypes.WIDGET_DELETE, deleteSaga),
    takeLatest(ReduxActionTypes.WIDGET_MOVE, moveSaga),
    takeLatest(ReduxActionTypes.WIDGET_RESIZE, resizeSaga),
  ]);
}
