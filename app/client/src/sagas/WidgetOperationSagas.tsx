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
  WidgetAddChildren,
} from "actions/pageActions";
import {
  FlattenedWidgetProps,
  CanvasWidgetsReduxState,
} from "reducers/entityReducers/canvasWidgetsReducer";
import {
  getWidgets,
  getWidget,
  getSelectedWidget,
  getWidgetMetaProps,
} from "./selectors";
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
import WidgetFactory from "utils/WidgetFactory";
import {
  buildWidgetBlueprint,
  executeWidgetBlueprintOperations,
} from "sagas/WidgetBlueprintSagas";
import { resetWidgetMetaProperty } from "actions/metaActions";
import {
  GridDefaults,
  WidgetTypes,
  MAIN_CONTAINER_WIDGET_ID,
  WIDGET_DELETE_UNDO_TIMEOUT,
  RenderModes,
} from "constants/WidgetConstants";
import ValidationFactory from "utils/ValidationFactory";
import WidgetConfigResponse from "mockResponses/WidgetConfigResponse";
import {
  saveCopiedWidget,
  getCopiedWidget,
  saveDeletedWidgets,
  flushDeletedWidgets,
  getDeletedWidgets,
} from "utils/storage";
import { AppToaster } from "components/editorComponents/ToastComponent";
import { generateReactKey } from "utils/generators";
import { flashElementById } from "utils/helpers";
import AnalyticsUtil from "utils/AnalyticsUtil";

function getChildWidgetProps(
  parent: FlattenedWidgetProps,
  params: WidgetAddChild,
  widgets: { [widgetId: string]: FlattenedWidgetProps },
) {
  const { leftColumn, topRow, newWidgetId, props, type } = params;
  let { rows, columns, parentColumnSpace, parentRowSpace, widgetName } = params;
  let minHeight = undefined;
  const defaultConfig: any = WidgetConfigResponse.config[type];
  if (!widgetName) {
    const widgetNames = Object.keys(widgets).map(w => widgets[w].widgetName);
    widgetName = getNextEntityName(defaultConfig.widgetName, widgetNames);
  }
  if (type === WidgetTypes.CANVAS_WIDGET) {
    columns =
      (parent.rightColumn - parent.leftColumn) * parent.parentColumnSpace;
    parentColumnSpace = 1;
    rows = (parent.bottomRow - parent.topRow) * parent.parentRowSpace;
    parentRowSpace = 1;
    minHeight = rows;
    if (props) props.children = [];
  }

  const widgetProps = { ...defaultConfig, ...props, columns, rows, minHeight };
  const widget = generateWidgetProps(
    parent,
    type,
    leftColumn,
    topRow,
    parentRowSpace,
    parentColumnSpace,
    widgetName,
    widgetProps,
  );

  widget.widgetId = newWidgetId;
  return widget;
}
type GeneratedWidgetPayload = {
  widgetId: string;
  widgets: { [widgetId: string]: FlattenedWidgetProps };
};
function* generateChildWidgets(
  parent: FlattenedWidgetProps,
  params: WidgetAddChild,
  widgets: { [widgetId: string]: FlattenedWidgetProps },
): any {
  const widget = yield getChildWidgetProps(parent, params, widgets);
  widgets[widget.widgetId] = widget;
  if (widget.blueprint && widget.blueprint.view) {
    const childWidgetList: WidgetAddChild[] = yield call(
      buildWidgetBlueprint,
      widget.blueprint,
      widget.widgetId,
    );
    const childPropsList: GeneratedWidgetPayload[] = yield all(
      childWidgetList.map((props: WidgetAddChild) => {
        return generateChildWidgets(widget, props, widgets);
      }),
    );
    widget.children = [];
    childPropsList.forEach((props: GeneratedWidgetPayload) => {
      widget.children.push(props.widgetId);
      widgets = props.widgets;
    });
  }

  widgets[widget.widgetId] = widget;
  if (
    widget.blueprint &&
    widget.blueprint.operations &&
    widget.blueprint.operations.length > 0
  ) {
    widgets = yield call(
      executeWidgetBlueprintOperations,
      widget.blueprint.operations,
      widgets,
      widget.widgetId,
    );
  }
  widget.parentId = parent.widgetId;
  return { widgetId: widget.widgetId, widgets };
}

export function* addChildSaga(addChildAction: ReduxAction<WidgetAddChild>) {
  try {
    AppToaster.clear();
    const { widgetId } = addChildAction.payload;

    // Get the current parent widget whose child will be the new widget.
    const parent: FlattenedWidgetProps = yield select(getWidget, widgetId);
    // Get all the widgets from the canvasWidgetsReducer
    const widgets = yield select(getWidgets);
    // Generate the full WidgetProps of the widget to be added.
    const childWidgetPayload: GeneratedWidgetPayload = yield generateChildWidgets(
      parent,
      addChildAction.payload,
      widgets,
    );

    // Update widgets to put back in the canvasWidgetsReducer
    // TODO(abhinav): This won't work if dont already have an empty children: []

    if (parent.children) parent.children.push(childWidgetPayload.widgetId);

    widgets[parent.widgetId] = parent;
    yield put(updateAndSaveLayout(widgets));
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

// This is different from addChildSaga
// It does not go through the blueprint based creation
// It simply uses the provided widget props to create widgets
// Use this only when we're 100% sure of all the props the children will need
export function* addChildrenSaga(
  addChildrenAction: ReduxAction<WidgetAddChildren>,
) {
  try {
    const { widgetId, children } = addChildrenAction.payload;
    const widgets = yield select(getWidgets);
    const widgetNames = Object.keys(widgets).map(w => widgets[w].widgetName);

    children.forEach(child => {
      // Create only if it doesn't already exist
      if (!widgets[child.widgetId]) {
        const defaultConfig: any = WidgetConfigResponse.config[child.type];
        const newWidgetName = getNextEntityName(
          defaultConfig.widgetName,
          widgetNames,
        );
        widgets[child.widgetId] = {
          ...child,
          widgetName: newWidgetName,
          renderMode: RenderModes.CANVAS,
        };
        if (
          widgets[widgetId].children &&
          Array.isArray(widgets[widgetId].children)
        ) {
          widgets[widgetId].children?.push(child.widgetId);
        } else widgets[widgetId].children = [child.widgetId];
      }
    });

    yield put(updateAndSaveLayout(widgets));
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.WIDGET_OPERATION_ERROR,
      payload: {
        action: ReduxActionTypes.WIDGET_ADD_CHILDREN,
        error,
      },
    });
  }
}

const getAllWidgetsInTree = (
  widgetId: string,
  canvasWidgets: CanvasWidgetsReduxState,
) => {
  const widget = canvasWidgets[widgetId];
  const widgetList = [widget];
  if (widget && widget.children) {
    widget.children
      .filter(Boolean)
      .forEach((childWidgetId: string) =>
        widgetList.push(...getAllWidgetsInTree(childWidgetId, canvasWidgets)),
      );
  }
  return widgetList;
};

export function* deleteSaga(deleteAction: ReduxAction<WidgetDelete>) {
  try {
    const { widgetId, parentId, disallowUndo } = deleteAction.payload;
    const widgets = yield select(getWidgets);
    const widget = yield select(getWidget, widgetId);
    const parent: FlattenedWidgetProps = yield select(getWidget, parentId);

    // Remove entry from parent's children

    if (parent.children) {
      const indexOfChild = parent.children.indexOf(widgetId);
      if (indexOfChild > -1) delete parent.children[indexOfChild];
      parent.children = parent.children.filter(Boolean);
    }

    widgets[parentId] = parent;

    const otherWidgetsToDelete = getAllWidgetsInTree(widgetId, widgets);
    const saveStatus = yield saveDeletedWidgets(otherWidgetsToDelete, widgetId);
    let widgetName = widget.widgetName;
    // SPECIAL HANDLING FOR TABS IN A TABS WIDGET
    if (parent.type === WidgetTypes.TABS_WIDGET && widget.tabName) {
      widgetName = widget.tabName;
    }
    if (saveStatus && !disallowUndo) {
      AppToaster.show({
        message: `${widgetName} deleted`,
        autoClose: WIDGET_DELETE_UNDO_TIMEOUT - 2000,
        type: "success",
        hideProgressBar: false,
        action: {
          text: "UNDO",
          dispatchableAction: {
            type: ReduxActionTypes.UNDO_DELETE_WIDGET,
            payload: {
              widgetId,
            },
          },
        },
      });
      setTimeout(() => {
        flushDeletedWidgets(widgetId);
      }, WIDGET_DELETE_UNDO_TIMEOUT);
    }

    otherWidgetsToDelete.forEach(widget => {
      delete widgets[widget.widgetId];
    });

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

function* deleteSelectedWidgetSaga(
  action?: ReduxAction<{ disallowUndo?: boolean }>,
) {
  const selectedWidget = yield select(getSelectedWidget);
  if (!selectedWidget) return;
  AnalyticsUtil.logEvent("WIDGET_DELETE_VIA_SHORTCUT", {
    widgetName: selectedWidget.widgetName,
    widgetType: selectedWidget.type,
  });
  yield put({
    type: ReduxActionTypes.WIDGET_DELETE,
    payload: {
      widgetId: selectedWidget.widgetId,
      parentId: selectedWidget.parentId,
      disallowUndo: !!action?.payload?.disallowUndo,
    },
  });
}

export function* undoDeleteSaga(action: ReduxAction<{ widgetId: string }>) {
  const deletedWidgets: FlattenedWidgetProps[] = yield getDeletedWidgets(
    action.payload.widgetId,
  );
  const deletedWidget = deletedWidgets.find(
    widget => widget.widgetId === action.payload.widgetId,
  );
  if (deletedWidget) {
    AnalyticsUtil.logEvent("WIDGET_DELETE_UNDO", {
      widgetName: deletedWidget.widgetName,
      widgetType: deletedWidget.type,
    });
  }

  if (deletedWidgets) {
    const widgets = yield select(getWidgets);
    deletedWidgets.forEach(widget => {
      widgets[widget.widgetId] = widget;
      if (widget.widgetId === action.payload.widgetId) {
        //SPECIAL HANDLING FOR TAB IN A TABS WIDGET
        if (widget.tabId && widget.type === WidgetTypes.CANVAS_WIDGET) {
          const parent = widgets[widget.parentId];
          if (parent.tabs) {
            const tabs = _.isString(parent.tabs)
              ? JSON.parse(parent.tabs)
              : parent.tabs;
            tabs.push({
              id: widget.tabId,
              widgetId: widget.widgetId,
              label: widget.tabName || widget.widgetName,
            });
            widgets[widget.parentId].tabs = JSON.stringify(tabs);
          } else {
            parent.tabs = JSON.stringify([
              {
                id: widget.tabId,
                widgetId: widget.widgetId,
                label: widget.tabName || widget.widgetName,
              },
            ]);
          }
        }
        if (widgets[widget.parentId].children)
          widgets[widget.parentId].children?.push(widget.widgetId);
        else widgets[widget.parentId].children = [widget.widgetId];
      }
    });

    yield put(updateAndSaveLayout(widgets));
    yield flushDeletedWidgets(action.payload.widgetId);
  }
}

export function* moveSaga(moveAction: ReduxAction<WidgetMove>) {
  try {
    AppToaster.clear();

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
    const parent: FlattenedWidgetProps = yield select(getWidget, parentId);
    // Update position of widget
    widget = updateWidgetPosition(widget, leftColumn, topRow);
    // Replace widget with update widget props
    widgets[widgetId] = widget;
    // If the parent has changed i.e parentWidgetId is not parent.widgetId
    if (parent.widgetId !== newParentId && widgetId !== newParentId) {
      // Remove from the previous parent

      if (parent.children) {
        const indexOfChild = parent.children.indexOf(widgetId);
        if (indexOfChild > -1) delete parent.children[indexOfChild];
        parent.children = parent.children.filter(Boolean);
      }

      // Add to new parent

      widgets[parent.widgetId] = parent;
      if (
        widgets[newParentId].children &&
        Array.isArray(widgets[newParentId].children)
      ) {
        widgets[newParentId].children?.push(widgetId);
      } else {
        widgets[newParentId].children = [widgetId];
      }
      widgets[widgetId].parentId = newParentId;
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
    AppToaster.clear();

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
  // TODO WIDGETFACTORY
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
  // const tree = yield select(evaluateDataTree);
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
      widget,
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

function* updateCanvasSize(
  action: ReduxAction<{ canvasWidgetId: string; snapRows: number }>,
) {
  const { canvasWidgetId, snapRows } = action.payload;
  const canvasWidget = yield select(getWidget, canvasWidgetId);

  const originalSnapRows = canvasWidget.bottomRow - canvasWidget.topRow;

  const newBottomRow = Math.round(
    snapRows * GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
  );
  /* Update the canvas's rows, ONLY if it has changed since the last render */
  if (originalSnapRows !== newBottomRow) {
    // TODO(abhinav): This considers that the topRow will always be zero
    // Check this out when non canvas widgets are updating snapRows
    // erstwhile: Math.round((rows * props.snapRowSpace) / props.parentRowSpace),
    yield put(updateWidgetProperty(canvasWidgetId, "bottomRow", newBottomRow));
  }
}

function* copyWidgetSaga(action: ReduxAction<{ isShortcut: boolean }>) {
  const selectedWidget = yield select(getSelectedWidget);
  if (!selectedWidget) return;
  const eventName = action.payload.isShortcut
    ? "WIDGET_COPY_VIA_SHORTCUT"
    : "WIDGET_COPY";
  AnalyticsUtil.logEvent(eventName, {
    widgetName: selectedWidget.widgetName,
    widgetType: selectedWidget.type,
  });
  const saveResult = yield saveCopiedWidget(JSON.stringify(selectedWidget));
  if (saveResult) {
    AppToaster.show({
      message: `Copied ${selectedWidget.widgetName}`,
      type: "success",
    });
  }
}

function* calculateNewWidgetPosition(widget: WidgetProps, parentId: string) {
  // Note: This is a very simple algorithm.
  // We take the bottom most widget in the canvas, then calculate the top,left,right,bottom
  // co-ordinates for the new widget, such that it can be placed at the bottom of the canvas.
  const canvaswidgets = yield select(getWidgets);
  const nextAvailableRow =
    Object.values(canvaswidgets).reduce(
      (prev: number, next: any) =>
        next.widgetId !== widget.parentId &&
        next.parentId === parentId &&
        next.bottomRow > prev
          ? next.bottomRow
          : prev,
      0,
    ) + 1;
  return {
    leftColumn: 0,
    rightColumn: widget.rightColumn - widget.leftColumn,
    topRow: nextAvailableRow,
    bottomRow: nextAvailableRow + (widget.bottomRow - widget.topRow),
  };
}

function* pasteWidgetSaga() {
  const copiedWidget: WidgetProps = yield getCopiedWidget();
  // Don't try to paste if there is no copied widget
  if (!copiedWidget) return;

  // Log the paste event
  AnalyticsUtil.logEvent("WIDGET_PASTE", {
    widgetName: copiedWidget.widgetName,
    widgetType: copiedWidget.type,
  });

  // If selected widget is a container like,
  // The new widget's parent will be canvas widget within the selected widget
  // Else, the new widget's parent will be the main canvas
  const selectedWidget = yield select(getSelectedWidget);
  let newWidgetParentId = MAIN_CONTAINER_WIDGET_ID;
  if (selectedWidget && selectedWidget.children) {
    let childWidget;
    if (selectedWidget.type !== WidgetTypes.TABS_WIDGET) {
      childWidget = yield select(getWidget, selectedWidget.children[0]);
    } else {
      const { selectedTabId } = yield select(
        getWidgetMetaProps,
        selectedWidget.widgetId,
      );
      const childWidgetId =
        selectedWidget.tabs.find((tab: any) => tab.id === selectedTabId)
          ?.widgetId || selectedWidget.children[0];
      childWidget = yield select(getWidget, childWidgetId);
    }
    if (childWidget && childWidget.type === WidgetTypes.CANVAS_WIDGET) {
      newWidgetParentId = childWidget.widgetId;
    }
  }

  // Compute the new widget's positional properties
  const {
    leftColumn,
    topRow,
    rightColumn,
    bottomRow,
  } = yield calculateNewWidgetPosition(copiedWidget, newWidgetParentId);

  const widgets = yield select(getWidgets);

  // Compute the new widget's name
  const defaultConfig: any = WidgetConfigResponse.config[copiedWidget.type];
  const widgetNames = Object.keys(widgets).map(w => widgets[w].widgetName);
  const newWidgetName = getNextEntityName(
    defaultConfig.widgetName,
    widgetNames,
  );

  // Generate the new widget object
  copiedWidget.leftColumn = leftColumn;
  copiedWidget.topRow = topRow;
  copiedWidget.rightColumn = rightColumn;
  copiedWidget.bottomRow = bottomRow;
  copiedWidget.parentId = newWidgetParentId;
  copiedWidget.widgetId = generateReactKey();
  copiedWidget.widgetName = newWidgetName;

  // Add the new widget to the canvas widgets
  if (copiedWidget && copiedWidget.widgetId) {
    widgets[copiedWidget.widgetId] = copiedWidget;
  }
  if (copiedWidget && copiedWidget.parentId && widgets[copiedWidget.parentId]) {
    // If the new widget goes beyond the bottomRow of the parent
    // Make the parent scroll contents
    // Note: MainContainer always scrolls contents.
    if (
      widgets[copiedWidget.parentId].bottomRow *
        widgets[copiedWidget.parentId].parentRowSpace <=
      copiedWidget.bottomRow * copiedWidget.parentRowSpace
    ) {
      if (copiedWidget.parentId !== MAIN_CONTAINER_WIDGET_ID) {
        widgets[
          widgets[copiedWidget.parentId].parentId
        ].shouldScrollContents = true;
      }
    }
    // Add the new widget's reference to the parent's children
    if (
      widgets[copiedWidget.parentId].children &&
      Array.isArray(widgets[copiedWidget.parentId].children)
    ) {
      widgets[copiedWidget.parentId].children?.push(copiedWidget.widgetId);
    } else {
      widgets[copiedWidget.parentId].children = [copiedWidget.widgetId];
    }
  }

  // save the new DSL
  yield put(updateAndSaveLayout(widgets));

  // Flash the newly pasted widget once the DSL is re-rendered
  setTimeout(() => flashElementById(copiedWidget.widgetId), 100);
  yield put({
    type: ReduxActionTypes.SELECT_WIDGET,
    payload: { widgetId: copiedWidget.widgetId },
  });
}

function* cutWidgetSaga() {
  yield put({
    type: ReduxActionTypes.COPY_SELECTED_WIDGET_INIT,
    payload: {
      isShortcut: true, // We only have shortcut based "cut" operation today.
    },
  });
  yield put({
    type: ReduxActionTypes.DELETE_SELECTED_WIDGET,
    payload: {
      disallowUndo: true,
    },
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
    takeEvery(
      ReduxActionTypes.SET_WIDGET_DYNAMIC_PROPERTY,
      setWidgetDynamicPropertySaga,
    ),
    takeEvery(
      ReduxActionTypes.RESET_CHILDREN_WIDGET_META,
      resetChildrenMetaSaga,
    ),
    takeLatest(ReduxActionTypes.UPDATE_CANVAS_SIZE, updateCanvasSize),
    takeLatest(ReduxActionTypes.COPY_SELECTED_WIDGET_INIT, copyWidgetSaga),
    takeEvery(ReduxActionTypes.PASTE_COPIED_WIDGET_INIT, pasteWidgetSaga),
    takeEvery(ReduxActionTypes.UNDO_DELETE_WIDGET, undoDeleteSaga),
    takeEvery(
      ReduxActionTypes.DELETE_SELECTED_WIDGET,
      deleteSelectedWidgetSaga,
    ),
    takeEvery(ReduxActionTypes.CUT_SELECTED_WIDGET, cutWidgetSaga),
    takeEvery(ReduxActionTypes.WIDGET_ADD_CHILDREN, addChildrenSaga),
  ]);
}
