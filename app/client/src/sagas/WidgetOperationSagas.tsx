import {
  ReduxActionTypes,
  ReduxAction,
} from "../constants/ReduxActionConstants";
import { WidgetAddChild } from "../actions/pageActions";
import { FlattenedWidgetProps } from "../reducers/entityReducers/canvasWidgetsReducer";
import { getWidgets, getWidget } from "./selectors";
import { generateWidgetProps } from "./utils";
import { put, select, takeEvery, all } from "redux-saga/effects";

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

// export function* removeChildSaga() {}

// export function* moveSaga() {}

// export function* resizeSaga() {}

export default function* widgetOperationSagas() {
  yield all([
    takeEvery(ReduxActionTypes.WIDGET_ADD_CHILD, addChildSaga),
    // takeEvery(ReduxActionTypes.WIDGET_REMOVE_CHILD, removeChildSaga),
    // takeEvery(ReduxActionTypes.WIDGET_MOVE, moveSaga),
    // takeEvery(ReduxActionTypes.WIDGET_RESIZE, resizeSaga),
  ]);
}
