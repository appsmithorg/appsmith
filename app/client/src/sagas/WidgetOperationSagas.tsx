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
  updateAndSaveLayout,
} from "actions/pageActions";
import { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsReducer";
import { getWidgets, getWidget, getDefaultWidgetConfig } from "./selectors";
import {
  generateWidgetProps,
  updateWidgetPosition,
} from "utils/WidgetPropsUtils";
import {
  call,
  put,
  select,
  takeEvery,
  takeLatest,
  all,
} from "redux-saga/effects";
import { convertToString, getNextEntityName } from "utils/AppsmithUtils";
import {
  SetWidgetDynamicPropertyPayload,
  updateWidgetProperty,
  UpdateWidgetPropertyRequestPayload,
} from "actions/controlActions";
import { isDynamicValue } from "utils/DynamicBindingUtils";
import { WidgetProps } from "widgets/BaseWidget";
import _ from "lodash";
import { WidgetTypes } from "constants/WidgetConstants";
import WidgetFactory from "utils/WidgetFactory";
import { buildWidgetBlueprint } from "sagas/WidgetBlueprintSagas";
import { resetWidgetMetaProperty } from "actions/metaActions";
import ValidationFactory from "utils/ValidationFactory";

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
      props,
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
      { ...defaultWidgetConfig, ...props },
    );
    childWidget.widgetId = newWidgetId;
    widgets[childWidget.widgetId] = childWidget;
    if (widget && widget.children) {
      widget.children.push(childWidget.widgetId);
    }
    widgets[widgetId] = widget;
    yield put(updateAndSaveLayout(widgets));
    if (defaultWidgetConfig.blueprint) {
      yield call(
        buildWidgetBlueprint,
        defaultWidgetConfig.blueprint,
        newWidgetId,
      );
    }
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
    yield put(updateAndSaveLayout(widgets));
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
    yield put(updateAndSaveLayout(widgets));
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

    if (
      widget.type === WidgetTypes.CONTAINER_WIDGET ||
      WidgetTypes.FORM_WIDGET
    ) {
      widget.snapRows = bottomRow - topRow - 1;
    }
    widget = { ...widget, leftColumn, rightColumn, topRow, bottomRow };
    widgets[widgetId] = widget;

    yield put(updateAndSaveLayout(widgets));
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

function* updateDynamicTriggers(
  widget: WidgetProps,
  propertyName: string,
  propertyValue: string,
) {
  const triggerProperties = WidgetFactory.getWidgetTriggerPropertiesMap(
    widget.type,
  );
  if (propertyName in triggerProperties) {
    let dynamicTriggers: Record<string, true> = widget.dynamicTriggers || {};
    if (propertyValue && !(propertyName in dynamicTriggers)) {
      dynamicTriggers[propertyName] = true;
    }
    if (!propertyValue && propertyName in dynamicTriggers) {
      dynamicTriggers = _.omit(dynamicTriggers, propertyName);
    }
    yield put(
      updateWidgetProperty(widget.widgetId, "dynamicTriggers", dynamicTriggers),
    );
    return true;
  }
  return false;
}

function* updateDynamicBindings(
  widget: WidgetProps,
  propertyName: string,
  propertyValue: string,
) {
  const isDynamic = isDynamicValue(propertyValue);
  let dynamicBindings: Record<string, boolean> = widget.dynamicBindings || {};
  if (!isDynamic && propertyName in dynamicBindings) {
    dynamicBindings = _.omit(dynamicBindings, propertyName);
  }
  if (isDynamic && !(propertyName in dynamicBindings)) {
    dynamicBindings[propertyName] = true;
  }
  yield put(
    updateWidgetProperty(widget.widgetId, "dynamicBindings", dynamicBindings),
  );
}

function* updateWidgetPropertySaga(
  updateAction: ReduxAction<UpdateWidgetPropertyRequestPayload>,
) {
  const {
    payload: { propertyValue, propertyName, widgetId },
  } = updateAction;
  const widget: WidgetProps = yield select(getWidget, widgetId);

  const dynamicTriggersUpdated = yield updateDynamicTriggers(
    widget,
    propertyName,
    propertyValue,
  );
  if (!dynamicTriggersUpdated)
    yield updateDynamicBindings(widget, propertyName, propertyValue);

  yield put(updateWidgetProperty(widgetId, propertyName, propertyValue));
  const widgets = yield select(getWidgets);
  yield put(updateAndSaveLayout(widgets));
}

function* setWidgetDynamicPropertySaga(
  action: ReduxAction<SetWidgetDynamicPropertyPayload>,
) {
  const { isDynamic, propertyName, widgetId } = action.payload;
  const widget: WidgetProps = yield select(getWidget, widgetId);
  const propertyValue = widget[propertyName];
  const dynamicProperties: Record<string, true> = {
    ...widget.dynamicProperties,
  };
  if (isDynamic) {
    dynamicProperties[propertyName] = true;
    const value = convertToString(propertyValue);
    yield put(updateWidgetProperty(widgetId, propertyName, value));
  } else {
    delete dynamicProperties[propertyName];
    const { parsed } = ValidationFactory.validateWidgetProperty(
      widget.type,
      propertyName,
      propertyValue,
    );
    yield put(updateWidgetProperty(widgetId, propertyName, parsed));
  }
  yield put(
    updateWidgetProperty(widgetId, "dynamicProperties", dynamicProperties),
  );
}

function* getWidgetChildren(widgetId: string): any {
  const childrenIds: string[] = [];
  const widget = yield select(getWidget, widgetId);
  const { children } = widget;
  if (children && children.length) {
    for (const childIndex in children) {
      const child = children[childIndex];
      childrenIds.push(child);
      const grandChildren = yield call(getWidgetChildren, child);
      if (grandChildren.length) {
        childrenIds.push(...grandChildren);
      }
    }
  }
  return childrenIds;
}

function* resetChildrenMetaSaga(action: ReduxAction<{ widgetId: string }>) {
  const parentWidgetId = action.payload.widgetId;
  const childrenIds: string[] = yield call(getWidgetChildren, parentWidgetId);
  for (const childIndex in childrenIds) {
    const childId = childrenIds[childIndex];
    yield put(resetWidgetMetaProperty(childId));
  }
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
    takeEvery(
      ReduxActionTypes.SET_WIDGET_DYNAMIC_PROPERTY,
      setWidgetDynamicPropertySaga,
    ),
    takeEvery(
      ReduxActionTypes.RESET_CHILDREN_WIDGET_META,
      resetChildrenMetaSaga,
    ),
  ]);
}
