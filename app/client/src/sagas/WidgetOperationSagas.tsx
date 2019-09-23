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
import { getWidgets, getWidget } from "./selectors";
import {
  generateWidgetProps,
  updateWidgetSize,
  updateWidgetPosition,
} from "./utils";
import { put, select, takeEvery, takeLatest, all } from "redux-saga/effects";

export function* addChildSaga(addChildAction: ReduxAction<WidgetAddChild>) {
  try {
    const { widgetId, type, left, top, width, height } = addChildAction.payload;
    const widget = yield (select(
      getWidget,
      widgetId,
    ) as any) as FlattenedWidgetProps;
    const widgets = yield select(getWidgets) as any;

    const childWidget = generateWidgetProps(
      widget,
      type,
      left,
      top,
      width,
      height,
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
    const widgets = yield select(getWidgets) as any;
    widgets[widgetId] = undefined;
    const parent = Object.values(widgets).find(
      (widget: any) =>
        widget.children &&
        widget.children.length > 0 &&
        widget.children.indexOf(widgetId) > -1,
    ) as any;
    parent.children = parent.children.filter(
      (child: string) => child !== widgetId,
    );
    widgets[parent.widgetId] = parent;
    yield put({
      type: ReduxActionTypes.UPDATE_LAYOUT,
      payload: { widgets },
    });
  } catch (err) {
    yield put({
      type: ReduxActionTypes.WIDGET_OPERATION_ERROR,
      action: ReduxActionTypes.WIDGET_DELETE,
      ...err,
    });
  }
}

export function* moveSaga(moveAction: ReduxAction<WidgetMove>) {
  try {
    const { widgetId, left, top, parentWidgetId } = moveAction.payload;
    let widget = yield (select(
      getWidget,
      widgetId,
    ) as any) as FlattenedWidgetProps;
    const widgets = yield select(getWidgets) as any;
    let parentWidget = null;
    if (parentWidgetId) {
      parentWidget = yield (select(
        getWidget,
        parentWidgetId,
      ) as any) as FlattenedWidgetProps;
    }
    widget = updateWidgetPosition(widget, left, top, parentWidget);
    widgets[widgetId] = widget;
    if (parentWidgetId) {
      widgets[parentWidgetId].children.push(widgetId);
      // TODO(abhinav): Find and remove entry from previous parent.
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

    let widget = yield (select(
      getWidget,
      widgetId,
    ) as any) as FlattenedWidgetProps;
    const widgets = yield select(getWidgets) as any;

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
