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
  updateWidgetPropertyRequest,
  UpdateWidgetPropertyRequestPayload,
} from "actions/controlActions";
import { isDynamicValue } from "utils/DynamicBindingUtils";
import { WidgetProps } from "widgets/BaseWidget";
import _, { isString } from "lodash";
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
  WidgetType,
} from "constants/WidgetConstants";
import ValidationFactory from "utils/ValidationFactory";
import WidgetConfigResponse from "mockResponses/WidgetConfigResponse";
import {
  saveCopiedWidgets,
  saveDeletedWidgets,
  flushDeletedWidgets,
  getDeletedWidgets,
  getCopiedWidgets,
} from "utils/storage";
import { AppToaster } from "components/editorComponents/ToastComponent";
import { generateReactKey } from "utils/generators";
import { flashElementById } from "utils/helpers";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { cloneDeep } from "lodash";
import log from "loglevel";
import { navigateToCanvas } from "pages/Editor/Explorer/Widgets/WidgetEntity";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { forceOpenPropertyPane } from "actions/widgetActions";
import { getDataTree } from "selectors/dataTreeSelectors";
import { DataTreeWidget } from "entities/DataTree/dataTreeFactory";

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
  delete widget.blueprint;
  return { widgetId: widget.widgetId, widgets };
}

export function* addChildSaga(addChildAction: ReduxAction<WidgetAddChild>) {
  try {
    const start = performance.now();
    AppToaster.clear();
    const { widgetId } = addChildAction.payload;

    // Get the current parent widget whose child will be the new widget.
    const stateParent: FlattenedWidgetProps = yield select(getWidget, widgetId);
    // const parent = Object.assign({}, stateParent);
    // Get all the widgets from the canvasWidgetsReducer
    const stateWidgets = yield select(getWidgets);
    const widgets = Object.assign({}, stateWidgets);
    // Generate the full WidgetProps of the widget to be added.
    const childWidgetPayload: GeneratedWidgetPayload = yield generateChildWidgets(
      stateParent,
      addChildAction.payload,
      widgets,
    );

    // Update widgets to put back in the canvasWidgetsReducer
    // TODO(abhinav): This won't work if dont already have an empty children: []
    const parent = {
      ...stateParent,
      children: [...(stateParent.children || []), childWidgetPayload.widgetId],
    };

    widgets[parent.widgetId] = parent;
    log.debug("add child computations took", performance.now() - start, "ms");
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
    const stateWidgets = yield select(getWidgets);
    const widgets = { ...stateWidgets };
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

        const existingChildren = widgets[widgetId].children || [];

        widgets[widgetId] = {
          ...widgets[widgetId],
          children: [...existingChildren, child.widgetId],
        };
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
    let { widgetId, parentId } = deleteAction.payload;
    const { disallowUndo, isShortcut } = deleteAction.payload;

    if (!widgetId) {
      const selectedWidget = yield select(getSelectedWidget);
      if (!selectedWidget) return;
      widgetId = selectedWidget.widgetId;
      parentId = selectedWidget.parentId;
    }

    if (widgetId && parentId) {
      const stateWidgets = yield select(getWidgets);
      const widgets = { ...stateWidgets };
      const stateWidget = yield select(getWidget, widgetId);
      const widget = { ...stateWidget };
      const stateParent: FlattenedWidgetProps = yield select(
        getWidget,
        parentId,
      );
      let parent = { ...stateParent };

      const analyticsEvent = isShortcut
        ? "WIDGET_DELETE_VIA_SHORTCUT"
        : "WIDGET_DELETE";

      AnalyticsUtil.logEvent(analyticsEvent, {
        widgetName: widget.widgetName,
        widgetType: widget.type,
      });

      // Remove entry from parent's children

      if (parent.children) {
        parent = {
          ...parent,
          children: parent.children.filter(c => c !== widgetId),
        };
      }

      widgets[parentId] = parent;

      const otherWidgetsToDelete = getAllWidgetsInTree(widgetId, widgets);
      const saveStatus = yield saveDeletedWidgets(
        otherWidgetsToDelete,
        widgetId,
      );
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
          if (widgetId) flushDeletedWidgets(widgetId);
        }, WIDGET_DELETE_UNDO_TIMEOUT);
      }

      const finalWidgets = _.omit(
        widgets,
        otherWidgetsToDelete.map(widgets => widgets.widgetId),
      );

      yield put(updateAndSaveLayout(finalWidgets));
    }
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

export function* undoDeleteSaga(action: ReduxAction<{ widgetId: string }>) {
  // Get the list of widget and its children which were deleted
  const deletedWidgets: FlattenedWidgetProps[] = yield getDeletedWidgets(
    action.payload.widgetId,
  );
  // Find the parent in the list of deleted widgets
  const deletedWidget = deletedWidgets.find(
    widget => widget.widgetId === action.payload.widgetId,
  );

  // If the deleted widget is infact available.
  if (deletedWidget) {
    // Log an undo event
    AnalyticsUtil.logEvent("WIDGET_DELETE_UNDO", {
      widgetName: deletedWidget.widgetName,
      widgetType: deletedWidget.type,
    });
  }

  if (deletedWidgets) {
    // Get the current list of widgets from reducer
    const stateWidgets = yield select(getWidgets);
    let widgets = { ...stateWidgets };
    // For each deleted widget
    deletedWidgets.forEach(widget => {
      // Add it to the widgets list we fetched from reducer
      widgets[widget.widgetId] = widget;
      // If the widget in question is the deleted widget
      if (widget.widgetId === action.payload.widgetId) {
        //SPECIAL HANDLING FOR TAB IN A TABS WIDGET
        if (widget.tabId && widget.type === WidgetTypes.CANVAS_WIDGET) {
          const parent = { ...widgets[widget.parentId] };
          if (parent.tabs) {
            try {
              const tabs = _.isString(parent.tabs)
                ? JSON.parse(parent.tabs)
                : parent.tabs;
              tabs.push({
                id: widget.tabId,
                widgetId: widget.widgetId,
                label: widget.tabName || widget.widgetName,
              });
              widgets = {
                ...widgets,
                [widget.parentId]: {
                  ...widgets[widget.parentId],
                  tabs: JSON.stringify(tabs),
                },
              };
            } catch (error) {
              log.debug("Error deleting tabs widget: ", { error });
            }
          } else {
            parent.tabs = JSON.stringify([
              {
                id: widget.tabId,
                widgetId: widget.widgetId,
                label: widget.tabName || widget.widgetName,
              },
            ]);
            widgets = {
              ...widgets,
              [widget.parentId]: parent,
            };
          }
        }
        let newChildren = [widget.widgetId];
        if (widgets[widget.parentId].children) {
          // Concatenate the list of paren't children with the current widgetId
          newChildren = newChildren.concat(widgets[widget.parentId].children);
        }
        widgets = {
          ...widgets,
          [widget.parentId]: {
            ...widgets[widget.parentId],
            children: newChildren,
          },
        };
      }
    });

    yield put(updateAndSaveLayout(widgets));
    yield flushDeletedWidgets(action.payload.widgetId);
  }
}

export function* moveSaga(moveAction: ReduxAction<WidgetMove>) {
  try {
    AppToaster.clear();
    const start = performance.now();
    const {
      widgetId,
      leftColumn,
      topRow,
      parentId,
      newParentId,
    } = moveAction.payload;
    const stateWidget: FlattenedWidgetProps = yield select(getWidget, widgetId);
    let widget = Object.assign({}, stateWidget);
    // Get all widgets from DSL/Redux Store
    const stateWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
    const widgets = Object.assign({}, stateWidgets);
    // Get parent from DSL/Redux Store
    const stateParent: FlattenedWidgetProps = yield select(getWidget, parentId);
    const parent = {
      ...stateParent,
      children: [...(stateParent.children || [])],
    };
    // Update position of widget
    const updatedPosition = updateWidgetPosition(widget, leftColumn, topRow);
    widget = { ...widget, ...updatedPosition };

    // Replace widget with update widget props
    widgets[widgetId] = widget;
    // If the parent has changed i.e parentWidgetId is not parent.widgetId
    if (parent.widgetId !== newParentId && widgetId !== newParentId) {
      // Remove from the previous parent

      if (parent.children && Array.isArray(parent.children)) {
        const indexOfChild = parent.children.indexOf(widgetId);
        if (indexOfChild > -1) delete parent.children[indexOfChild];
        parent.children = parent.children.filter(Boolean);
      }

      // Add to new parent

      widgets[parent.widgetId] = parent;
      const newParent = {
        ...widgets[newParentId],
        children: widgets[newParentId].children
          ? [...(widgets[newParentId].children || []), widgetId]
          : [widgetId],
      };
      widgets[widgetId].parentId = newParentId;
      widgets[newParentId] = newParent;
    }
    log.debug("move computations took", performance.now() - start, "ms");

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
    const start = performance.now();
    const {
      widgetId,
      leftColumn,
      rightColumn,
      topRow,
      bottomRow,
    } = resizeAction.payload;

    const stateWidget: FlattenedWidgetProps = yield select(getWidget, widgetId);
    let widget = { ...stateWidget };
    const stateWidgets = yield select(getWidgets);
    const widgets = { ...stateWidgets };

    widget = { ...widget, leftColumn, rightColumn, topRow, bottomRow };
    widgets[widgetId] = widget;
    log.debug("resize computations took", performance.now() - start, "ms");
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
    let dynamicTriggers: Record<string, true> = widget.dynamicTriggers
      ? { ...widget.dynamicTriggers }
      : {};
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
  propertyValue: any,
) {
  let stringProp = propertyValue;
  if (_.isObject(propertyValue)) {
    // Stringify this because composite controls may have bindings in the sub controls
    stringProp = JSON.stringify(propertyValue);
  }
  const isDynamic = isDynamicValue(stringProp);
  let dynamicBindings: Record<string, boolean> =
    { ...widget.dynamicBindings } || {};
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
  const stateWidget: WidgetProps = yield select(getWidget, widgetId);
  const widget = { ...stateWidget };

  const dynamicTriggersUpdated = yield updateDynamicTriggers(
    widget,
    propertyName,
    propertyValue,
  );
  if (!dynamicTriggersUpdated)
    yield updateDynamicBindings(widget, propertyName, propertyValue);

  yield put(updateWidgetProperty(widgetId, propertyName, propertyValue));
  const stateWidgets = yield select(getWidgets);
  const widgets = { ...stateWidgets, [widgetId]: widget };
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
    // TODO (hetu) can we eliminate this use of validation
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
  yield call(resetEvaluatedWidgetMetaProperties, childrenIds);
}

// This is needed because evaluation takes some time and we can reset the props
// in the evaluated value much faster like this
function* resetEvaluatedWidgetMetaProperties(widgetIds: string[]) {
  const evaluatedDataTree = yield select(getDataTree);
  const updates: Record<string, DataTreeWidget> = {};
  for (const index in widgetIds) {
    const widgetId = widgetIds[index];
    const widget = _.find(evaluatedDataTree, { widgetId }) as DataTreeWidget;
    const widgetToUpdate = { ...widget };
    const metaPropsMap = WidgetFactory.getWidgetMetaPropertiesMap(widget.type);
    const defaultPropertiesMap = WidgetFactory.getWidgetDefaultPropertiesMap(
      widget.type,
    );
    Object.keys(metaPropsMap).forEach(metaProp => {
      if (metaProp in defaultPropertiesMap) {
        widgetToUpdate[metaProp] = widget[defaultPropertiesMap[metaProp]];
      } else {
        widgetToUpdate[metaProp] = metaPropsMap[metaProp];
      }
    });
    updates[widget.widgetName] = widgetToUpdate;
  }
  const newEvaluatedDataTree = {
    ...evaluatedDataTree,
    ...updates,
  };
  yield put({
    type: ReduxActionTypes.SET_EVALUATED_TREE,
    payload: newEvaluatedDataTree,
  });
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
  const widgets = yield select(getWidgets);
  const widgetsToStore = getAllWidgetsInTree(selectedWidget.widgetId, widgets);
  const eventName = action.payload.isShortcut
    ? "WIDGET_COPY_VIA_SHORTCUT"
    : "WIDGET_COPY";
  AnalyticsUtil.logEvent(eventName, {
    widgetName: selectedWidget.widgetName,
    widgetType: selectedWidget.type,
  });
  const saveResult = yield saveCopiedWidgets(
    JSON.stringify({ widgetId: selectedWidget.widgetId, list: widgetsToStore }),
  );
  if (saveResult) {
    AppToaster.show({
      message: `Copied ${selectedWidget.widgetName}`,
      type: "success",
    });
  }
}

function calculateNewWidgetPosition(
  widget: WidgetProps,
  parentId: string,
  canvasWidgets: FlattenedWidgetProps[],
) {
  // Note: This is a very simple algorithm.
  // We take the bottom most widget in the canvas, then calculate the top,left,right,bottom
  // co-ordinates for the new widget, such that it can be placed at the bottom of the canvas.
  const nextAvailableRow =
    Object.values(canvasWidgets).reduce(
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

function getNextWidgetName(widgets: CanvasWidgetsReduxState, type: WidgetType) {
  // Compute the new widget's name
  const defaultConfig: any = WidgetConfigResponse.config[type];
  const widgetNames = Object.keys(widgets).map(w => widgets[w].widgetName);
  return getNextEntityName(defaultConfig.widgetName, widgetNames);
}

function* pasteWidgetSaga() {
  const copiedWidgets: {
    widgetId: string;
    list: WidgetProps[];
  } = yield getCopiedWidgets();
  // Don't try to paste if there is no copied widget
  if (!copiedWidgets) return;
  const copiedWidgetId = copiedWidgets.widgetId;
  const copiedWidget = copiedWidgets.list.find(
    widget => widget.widgetId === copiedWidgetId,
  );
  if (copiedWidget) {
    // Log the paste event
    AnalyticsUtil.logEvent("WIDGET_PASTE", {
      widgetName: copiedWidget.widgetName,
      widgetType: copiedWidget.type,
    });

    const stateWidgets = yield select(getWidgets);
    let widgets = { ...stateWidgets };

    const selectedWidget = yield select(getSelectedWidget);
    let newWidgetParentId = MAIN_CONTAINER_WIDGET_ID;
    let parentWidget = widgets[MAIN_CONTAINER_WIDGET_ID];

    // If the selected widget is not the main container
    if (
      selectedWidget &&
      selectedWidget.widgetId !== MAIN_CONTAINER_WIDGET_ID
    ) {
      // Select the parent of the selected widget if parent is not
      // the main container
      if (
        selectedWidget.parentId !== MAIN_CONTAINER_WIDGET_ID &&
        widgets[selectedWidget.parentId] &&
        widgets[selectedWidget.parentId].children &&
        widgets[selectedWidget.parentId].children.length > 0
      ) {
        parentWidget = widgets[selectedWidget.parentId];
        newWidgetParentId = selectedWidget.parentId;
      }
      // Select the selected widget if the widget is container like
      if (selectedWidget.children) {
        parentWidget = widgets[selectedWidget.widgetId];
      }
    }

    // If the parent widget in which to paste the copied widget
    // is not the main container and is not a canvas widget
    if (
      parentWidget.widgetId !== MAIN_CONTAINER_WIDGET_ID &&
      parentWidget.type !== WidgetTypes.CANVAS_WIDGET
    ) {
      let childWidget;
      // If the widget in which to paste the new widget is NOT
      // a tabs widget
      if (parentWidget.type !== WidgetTypes.TABS_WIDGET) {
        // The child will be a CANVAS_WIDGET, as we've established
        // this parent widget to be a container like widget
        // Which always has its first child as a canvas widget
        childWidget = widgets[parentWidget.children[0]];
      } else {
        // If the widget in which to paste the new widget is a tabs widget
        // Find the currently selected tab canvas widget
        const { selectedTabId } = yield select(
          getWidgetMetaProps,
          parentWidget.widgetId,
        );
        const tabs = _.isString(parentWidget.tabs)
          ? JSON.parse(parentWidget.tabs)
          : parentWidget.tabs;
        const childWidgetId =
          tabs.find((tab: any) => tab.id === selectedTabId)?.widgetId ||
          parentWidget.children[0];
        childWidget = widgets[childWidgetId];
      }
      // If the finally selected parent in which to paste the widget
      // is a CANVAS_WIDGET, use its widgetId as the new widget's parent Id
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
    } = yield calculateNewWidgetPosition(
      copiedWidget,
      newWidgetParentId,
      widgets,
    );

    // Get a flat list of all the widgets to be updated
    const widgetList = copiedWidgets.list;
    const widgetIdMap: Record<string, string> = {};
    const newWidgetList: FlattenedWidgetProps[] = [];
    let newWidgetId: string = copiedWidget.widgetId;
    // Generate new widgetIds for the flat list of all the widgets to be updated
    widgetList.forEach(widget => {
      // Create a copy of the widget properties
      const newWidget = cloneDeep(widget);
      newWidget.widgetId = generateReactKey();
      // Add the new widget id so that it maps the previous widget id
      widgetIdMap[widget.widgetId] = newWidget.widgetId;
      // Add the new widget to the list
      newWidgetList.push(newWidget);
    });

    // For each of the new widgets generated
    newWidgetList.forEach(widget => {
      // Update the children widgetIds if it has children
      if (widget.children && widget.children.length > 0) {
        widget.children.forEach((childWidgetId: string, index: number) => {
          if (widget.children) {
            widget.children[index] = widgetIdMap[childWidgetId];
          }
        });
      }

      // Update the tabs for the tabs widget.
      if (widget.tabs && widget.type === WidgetTypes.TABS_WIDGET) {
        try {
          const tabs = isString(widget.tabs)
            ? JSON.parse(widget.tabs)
            : widget.tabs;
          if (Array.isArray(tabs)) {
            widget.tabs = JSON.stringify(
              tabs.map(tab => {
                tab.widgetId = widgetIdMap[tab.widgetId];
                return tab;
              }),
            );
          }
        } catch (error) {
          log.debug("Error updating tabs", error);
        }
      }

      // If it is the copied widget, update position properties
      if (widget.widgetId === widgetIdMap[copiedWidget.widgetId]) {
        newWidgetId = widget.widgetId;
        widget.leftColumn = leftColumn;
        widget.topRow = topRow;
        widget.bottomRow = bottomRow;
        widget.rightColumn = rightColumn;
        widget.parentId = newWidgetParentId;
        // Also, update the parent widget in the canvas widgets
        // to include this new copied widget's id in the parent's children
        let parentChildren = [widget.widgetId];
        if (
          widgets[newWidgetParentId].children &&
          Array.isArray(widgets[newWidgetParentId].children)
        ) {
          // Add the new child to existing children
          parentChildren = parentChildren.concat(
            widgets[newWidgetParentId].children,
          );
        }
        widgets = {
          ...widgets,
          [newWidgetParentId]: {
            ...widgets[newWidgetParentId],
            children: parentChildren,
          },
        };
        // If the copied widget's boundaries exceed the parent's
        // Make the parent scrollable
        if (
          widgets[newWidgetParentId].bottomRow *
            widgets[widget.parentId].parentRowSpace <=
          widget.bottomRow * widget.parentRowSpace
        ) {
          if (widget.parentId !== MAIN_CONTAINER_WIDGET_ID) {
            const parent = widgets[widgets[newWidgetParentId].parentId];
            widgets[widgets[newWidgetParentId].parentId] = {
              ...parent,
              shouldScrollContents: true,
            };
          }
        }
      } else {
        // For all other widgets in the list
        // (These widgets will be descendants of the copied widget)
        // This means, that their parents will also be newly copied widgets
        // Update widget's parent widget ids with the new parent widget ids
        const newParentId = newWidgetList.find(
          newWidget => newWidget.widgetId === widgetIdMap[widget.parentId],
        )?.widgetId;
        if (newParentId) widget.parentId = newParentId;
      }
      // Generate a new unique widget name
      widget.widgetName = getNextWidgetName(widgets, widget.type);
      // Add the new widget to the canvas widgets
      widgets[widget.widgetId] = widget;
    });

    // save the new DSL
    yield put(updateAndSaveLayout(widgets));

    // Flash the newly pasted widget once the DSL is re-rendered
    setTimeout(() => flashElementById(newWidgetId), 100);
    yield put({
      type: ReduxActionTypes.SELECT_WIDGET,
      payload: { widgetId: newWidgetId },
    });
  }
}

function* cutWidgetSaga() {
  yield put({
    type: ReduxActionTypes.COPY_SELECTED_WIDGET_INIT,
    payload: {
      isShortcut: true, // We only have shortcut based "cut" operation today.
    },
  });
  yield put({
    type: ReduxActionTypes.WIDGET_DELETE,
    payload: {
      disallowUndo: true,
      isShortcut: true,
    },
  });
}

function* addTableWidgetFromQuerySaga(action: ReduxAction<string>) {
  try {
    const columns = 8;
    const rows = 7;
    const queryName = action.payload;
    const widgets = yield select(getWidgets);
    const widgetName = getNextWidgetName(widgets, "TABLE_WIDGET");

    let newWidget = {
      type: WidgetTypes.TABLE_WIDGET,
      newWidgetId: generateReactKey(),
      widgetId: "0",
      topRow: 0,
      bottomRow: rows,
      leftColumn: 0,
      rightColumn: columns,
      columns,
      rows,
      parentId: "0",
      widgetName,
      renderMode: RenderModes.CANVAS,
      parentRowSpace: 1,
      parentColumnSpace: 1,
      isLoading: false,
    };
    const {
      leftColumn,
      topRow,
      rightColumn,
      bottomRow,
    } = yield calculateNewWidgetPosition(newWidget, "0", widgets);

    newWidget = {
      ...newWidget,
      leftColumn,
      topRow,
      rightColumn,
      bottomRow,
    };

    yield put({
      type: ReduxActionTypes.WIDGET_ADD_CHILD,
      payload: newWidget,
    });

    const applicationId = yield select(getCurrentApplicationId);
    const pageId = yield select(getCurrentPageId);

    navigateToCanvas(
      {
        applicationId,
        pageId,
      },
      window.location.pathname,
      pageId,
      newWidget.newWidgetId,
    );
    yield put({
      type: ReduxActionTypes.SELECT_WIDGET,
      payload: { widgetId: newWidget.newWidgetId },
    });
    yield put(forceOpenPropertyPane(newWidget.newWidgetId));
    yield put(
      updateWidgetPropertyRequest(
        newWidget.newWidgetId,
        "tableData",
        `{{${queryName}.data}}`,
        RenderModes.CANVAS,
      ),
    );
  } catch (error) {
    AppToaster.show({
      message: "Failed to add the widget",
      type: "error",
    });
  }
}

export default function* widgetOperationSagas() {
  yield all([
    takeEvery(
      ReduxActionTypes.ADD_TABLE_WIDGET_FROM_QUERY,
      addTableWidgetFromQuerySaga,
    ),
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
    takeEvery(ReduxActionTypes.CUT_SELECTED_WIDGET, cutWidgetSaga),
    takeEvery(ReduxActionTypes.WIDGET_ADD_CHILDREN, addChildrenSaga),
  ]);
}
