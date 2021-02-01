import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "constants/ReduxActionConstants";
import {
  updateAndSaveLayout,
  WidgetAddChild,
  WidgetAddChildren,
  WidgetDelete,
  WidgetMove,
  WidgetResize,
} from "actions/pageActions";
import {
  CanvasWidgetsReduxState,
  FlattenedWidgetProps,
} from "reducers/entityReducers/canvasWidgetsReducer";
import {
  getSelectedWidget,
  getWidget,
  getWidgetMetaProps,
  getWidgets,
} from "./selectors";
import {
  generateWidgetProps,
  updateWidgetPosition,
} from "utils/WidgetPropsUtils";
import {
  all,
  call,
  put,
  select,
  takeEvery,
  takeLatest,
} from "redux-saga/effects";
import { convertToString, getNextEntityName } from "utils/AppsmithUtils";
import {
  DeleteWidgetPropertyPayload,
  SetWidgetDynamicPropertyPayload,
  updateWidgetProperty,
  UpdateWidgetPropertyPayload,
  UpdateWidgetPropertyRequestPayload,
} from "actions/controlActions";
import {
  DynamicPath,
  getEntityDynamicBindingPathList,
  getWidgetDynamicPropertyPathList,
  getWidgetDynamicTriggerPathList,
  isChildPropertyPath,
  isDynamicValue,
  isPathADynamicBinding,
  isPathADynamicTrigger,
} from "utils/DynamicBindingUtils";
import { WidgetProps } from "widgets/BaseWidget";
import _, { cloneDeep } from "lodash";
import WidgetFactory from "utils/WidgetFactory";
import {
  buildWidgetBlueprint,
  executeWidgetBlueprintOperations,
} from "sagas/WidgetBlueprintSagas";
import { resetWidgetMetaProperty } from "actions/metaActions";
import {
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
  RenderModes,
  WIDGET_DELETE_UNDO_TIMEOUT,
  WidgetType,
  WidgetTypes,
} from "constants/WidgetConstants";
import WidgetConfigResponse from "mockResponses/WidgetConfigResponse";
import {
  flushDeletedWidgets,
  getCopiedWidgets,
  getDeletedWidgets,
  saveCopiedWidgets,
  saveDeletedWidgets,
} from "utils/storage";
import { generateReactKey } from "utils/generators";
import { flashElementById } from "utils/helpers";
import AnalyticsUtil from "utils/AnalyticsUtil";
import log from "loglevel";
import { navigateToCanvas } from "pages/Editor/Explorer/Widgets/WidgetEntity";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { forceOpenPropertyPane } from "actions/widgetActions";
import { getDataTree } from "selectors/dataTreeSelectors";
import { DataTreeWidget } from "entities/DataTree/dataTreeFactory";
import {
  clearEvalPropertyCacheOfWidget,
  validateProperty,
} from "./EvaluationsSaga";
import { WidgetBlueprint } from "reducers/entityReducers/widgetConfigReducer";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";

function getChildWidgetProps(
  parent: FlattenedWidgetProps,
  params: WidgetAddChild,
  widgets: { [widgetId: string]: FlattenedWidgetProps },
) {
  const { leftColumn, topRow, newWidgetId, props, type } = params;
  let { rows, columns, parentColumnSpace, parentRowSpace, widgetName } = params;
  let minHeight = undefined;
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const { blueprint = undefined, ...restDefaultConfig } = {
    ...(WidgetConfigResponse as any).config[type],
  };
  if (!widgetName) {
    const widgetNames = Object.keys(widgets).map((w) => widgets[w].widgetName);
    widgetName = getNextEntityName(restDefaultConfig.widgetName, widgetNames);
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

  const widgetProps = {
    ...restDefaultConfig,
    ...props,
    columns,
    rows,
    minHeight,
  };
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
  propsBlueprint?: WidgetBlueprint,
): any {
  // Get the props for the widget
  const widget = yield getChildWidgetProps(parent, params, widgets);

  // Add the widget to the canvasWidgets
  // We need this in here as widgets will be used to get the current widget
  widgets[widget.widgetId] = widget;

  // Get the default config for the widget from WidgetConfigResponse
  const defaultConfig = {
    ...(WidgetConfigResponse as any).config[widget.type],
  };

  // If blueprint is provided in the params, use that
  // else use the blueprint available in WidgetConfigResponse
  // else there is no blueprint for this widget
  const blueprint =
    propsBlueprint || { ...defaultConfig.blueprint } || undefined;

  // If there is a blueprint.view
  // We need to generate the children based on the view
  if (blueprint && blueprint.view) {
    // Get the list of children props in WidgetAddChild format
    const childWidgetList: WidgetAddChild[] = yield call(
      buildWidgetBlueprint,
      blueprint,
      widget.widgetId,
    );
    // For each child props
    const childPropsList: GeneratedWidgetPayload[] = yield all(
      childWidgetList.map((props: WidgetAddChild) => {
        // Generate full widget props
        // Notice that we're passing the blueprint if it exists.
        return generateChildWidgets(
          widget,
          props,
          widgets,
          props.props?.blueprint,
        );
      }),
    );
    // Start children array from scratch
    widget.children = [];
    childPropsList.forEach((props: GeneratedWidgetPayload) => {
      // Push the widgetIds of the children generated above into the widget.children array
      widget.children.push(props.widgetId);
      // Add the list of widgets generated into the canvasWidgets
      widgets = props.widgets;
    });
  }

  // Finally, add the widget to the canvasWidgets
  // This is different from above, as this is the final widget props with
  // a fully populated widget.children property
  widgets[widget.widgetId] = widget;

  // Some widgets need to run a few operations like modifying props or adding an action
  // these operations can be performed on the parent of the widget we're adding
  // therefore, we pass all widgets to executeWidgetBlueprintOperations
  // blueprint.operations contain the set of operations to perform to update the canvasWidgets
  if (blueprint && blueprint.operations && blueprint.operations.length > 0) {
    // Finalize the canvasWidgets with everything that needs to be updated
    widgets = yield call(
      executeWidgetBlueprintOperations,
      blueprint.operations,
      widgets,
      widget.widgetId,
    );
  }
  // Add the parentId prop to this widget
  widget.parentId = parent.widgetId;
  // Remove the blueprint from the widget (if any)
  // as blueprints are not useful beyond this point.
  delete widget.blueprint;
  return { widgetId: widget.widgetId, widgets };
}

export function* addChildSaga(addChildAction: ReduxAction<WidgetAddChild>) {
  try {
    const start = performance.now();
    Toaster.clear();
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
    const widgetNames = Object.keys(widgets).map((w) => widgets[w].widgetName);

    children.forEach((child) => {
      // Create only if it doesn't already exist
      if (!widgets[child.widgetId]) {
        const defaultConfig: any = WidgetConfigResponse.config[child.type];
        const newWidgetName = getNextEntityName(
          defaultConfig.widgetName,
          widgetNames,
        );
        // update the list of widget names for the next iteration
        widgetNames.push(newWidgetName);
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

/**
 * Note: Mutates finalWidgets[parentId].bottomRow for CANVAS_WIDGET
 * @param finalWidgets
 * @param parentId
 */
const resizeCanvasToLowestWidget = (
  finalWidgets: CanvasWidgetsReduxState,
  parentId: string,
) => {
  if (
    !finalWidgets[parentId] ||
    finalWidgets[parentId].type !== WidgetTypes.CANVAS_WIDGET
  ) {
    return;
  }

  let lowestBottomRow = 0;
  const childIds = finalWidgets[parentId].children || [];
  // find lowest row
  childIds.forEach((cId) => {
    const child = finalWidgets[cId];
    if (child.bottomRow > lowestBottomRow) {
      lowestBottomRow = child.bottomRow;
    }
  });
  finalWidgets[parentId].bottomRow =
    (lowestBottomRow + GridDefaults.CANVAS_EXTENSION_OFFSET) *
    GridDefaults.DEFAULT_GRID_ROW_HEIGHT;
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
          children: parent.children.filter((c) => c !== widgetId),
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
        Toaster.show({
          text: `${widgetName} deleted`,
          hideProgressBar: false,
          variant: Variant.success,
          dispatchableAction: {
            type: ReduxActionTypes.UNDO_DELETE_WIDGET,
            payload: {
              widgetId,
            },
          },
        });
        setTimeout(() => {
          if (widgetId) flushDeletedWidgets(widgetId);
        }, WIDGET_DELETE_UNDO_TIMEOUT);
      }

      yield call(clearEvalPropertyCacheOfWidget, widgetName);

      const finalWidgets: CanvasWidgetsReduxState = _.omit(
        widgets,
        otherWidgetsToDelete.map((widgets) => widgets.widgetId),
      );

      // Note: mutates finalWidgets
      resizeCanvasToLowestWidget(finalWidgets, parentId);

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
  if (deletedWidgets && Array.isArray(deletedWidgets)) {
    // Find the parent in the list of deleted widgets
    const deletedWidget = deletedWidgets.find(
      (widget) => widget.widgetId === action.payload.widgetId,
    );

    // If the deleted widget is in fact available.
    if (deletedWidget) {
      // Log an undo event
      AnalyticsUtil.logEvent("WIDGET_DELETE_UNDO", {
        widgetName: deletedWidget.widgetName,
        widgetType: deletedWidget.type,
      });
    }

    // Get the current list of widgets from reducer
    const stateWidgets = yield select(getWidgets);
    let widgets = { ...stateWidgets };
    // For each deleted widget
    deletedWidgets.forEach((widget) => {
      // Add it to the widgets list we fetched from reducer
      widgets[widget.widgetId] = widget;
      // If the widget in question is the deleted widget
      if (widget.widgetId === action.payload.widgetId) {
        //SPECIAL HANDLING FOR TAB IN A TABS WIDGET
        if (widget.tabId && widget.type === WidgetTypes.CANVAS_WIDGET) {
          const parent = { ...widgets[widget.parentId] };
          if (parent.tabs) {
            parent.tabs = parent.tabs.slice();
            try {
              parent.tabs.push({
                id: widget.tabId,
                widgetId: widget.widgetId,
                label: widget.tabName || widget.widgetName,
              });
              widgets = {
                ...widgets,
                [widget.parentId]: {
                  ...widgets[widget.parentId],
                  tabs: parent.tabs,
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
          // Concatenate the list of parents children with the current widgetId
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
    Toaster.clear();
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
    Toaster.clear();
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

enum DynamicPathUpdateEffectEnum {
  ADD = "ADD",
  REMOVE = "REMOVE",
  NOOP = "NOOP",
}

type DynamicPathUpdate = {
  propertyPath: string;
  effect: DynamicPathUpdateEffectEnum;
};

function getDynamicTriggerPathListUpdate(
  widget: WidgetProps,
  propertyPath: string,
  propertyValue: string,
): DynamicPathUpdate {
  if (propertyValue && !isPathADynamicTrigger(widget, propertyPath)) {
    return {
      propertyPath,
      effect: DynamicPathUpdateEffectEnum.ADD,
    };
  } else if (!propertyValue && !isPathADynamicTrigger(widget, propertyPath)) {
    return {
      propertyPath,
      effect: DynamicPathUpdateEffectEnum.REMOVE,
    };
  }
  return {
    propertyPath,
    effect: DynamicPathUpdateEffectEnum.NOOP,
  };
}

function getDynamicBindingPathListUpdate(
  widget: WidgetProps,
  propertyPath: string,
  propertyValue: any,
): DynamicPathUpdate {
  let stringProp = propertyValue;
  if (_.isObject(propertyValue)) {
    // Stringify this because composite controls may have bindings in the sub controls
    stringProp = JSON.stringify(propertyValue);
  }
  const isDynamic = isDynamicValue(stringProp);
  if (!isDynamic && isPathADynamicBinding(widget, propertyPath)) {
    return {
      propertyPath,
      effect: DynamicPathUpdateEffectEnum.REMOVE,
    };
  } else if (isDynamic && !isPathADynamicBinding(widget, propertyPath)) {
    return {
      propertyPath,
      effect: DynamicPathUpdateEffectEnum.ADD,
    };
  }
  return {
    propertyPath,
    effect: DynamicPathUpdateEffectEnum.NOOP,
  };
}

function applyDynamicPathUpdates(
  currentList: DynamicPath[],
  update: DynamicPathUpdate,
): DynamicPath[] {
  if (update.effect === DynamicPathUpdateEffectEnum.ADD) {
    currentList.push({
      key: update.propertyPath,
    });
  } else if (update.effect === DynamicPathUpdateEffectEnum.REMOVE) {
    _.reject(currentList, { key: update.propertyPath });
  }
  return currentList;
}

function* updateWidgetPropertySaga(
  updateAction: ReduxAction<UpdateWidgetPropertyRequestPayload>,
) {
  const {
    payload: { propertyValue, propertyPath, widgetId },
  } = updateAction;
  if (!widgetId) {
    // Handling the case where sometimes widget id is not passed through here
    return;
  }
  const stateWidget: WidgetProps = yield select(getWidget, widgetId);
  const widget = { ...stateWidget };

  // Holder object to collect all updates
  const updates: Record<string, unknown> = {
    [propertyPath]: propertyValue,
  };

  // Check if the path is a of a dynamic trigger property
  const triggerProperties = WidgetFactory.getWidgetTriggerPropertiesMap(
    widget.type,
  );
  const isTriggerProperty = propertyPath in triggerProperties;
  // If it is a trigger property, it will go in a different list than the general
  // dynamicBindingPathList.
  if (isTriggerProperty) {
    const currentDynamicTriggerPathList: DynamicPath[] = getWidgetDynamicTriggerPathList(
      widget,
    );
    const effect = getDynamicTriggerPathListUpdate(
      widget,
      propertyPath,
      propertyValue,
    );
    updates.dynamicTriggerPathList = applyDynamicPathUpdates(
      currentDynamicTriggerPathList,
      effect,
    );
  } else {
    const currentDynamicBindingPathList: DynamicPath[] = getEntityDynamicBindingPathList(
      widget,
    );
    const effect = getDynamicBindingPathListUpdate(
      widget,
      propertyPath,
      propertyValue,
    );
    updates.dynamicBindingPathList = applyDynamicPathUpdates(
      currentDynamicBindingPathList,
      effect,
    );
  }

  // Send the updates
  yield put(updateWidgetProperty(widgetId, updates));

  const stateWidgets = yield select(getWidgets);
  const widgets = { ...stateWidgets, [widgetId]: widget };

  // Save the layout
  yield put(updateAndSaveLayout(widgets));
}

function* setWidgetDynamicPropertySaga(
  action: ReduxAction<SetWidgetDynamicPropertyPayload>,
) {
  const { isDynamic, propertyPath, widgetId } = action.payload;
  const widget: WidgetProps = yield select(getWidget, widgetId);
  const propertyValue = _.get(widget, propertyPath);
  let dynamicPropertyPathList = getWidgetDynamicPropertyPathList(widget);
  const propertyUpdates: Record<string, unknown> = {};
  if (isDynamic) {
    dynamicPropertyPathList.push({
      key: propertyPath,
    });
    propertyUpdates[propertyPath] = convertToString(propertyValue);
  } else {
    dynamicPropertyPathList = _.reject(dynamicPropertyPathList, {
      key: propertyPath,
    });
    const { parsed } = yield call(
      validateProperty,
      widget.type,
      propertyPath,
      propertyValue,
      widget,
    );
    propertyUpdates[propertyPath] = parsed;
  }
  propertyUpdates.dynamicPropertyPathList = dynamicPropertyPathList;

  yield put(updateWidgetProperty(widgetId, propertyUpdates));

  const stateWidgets = yield select(getWidgets);
  const widgets = { ...stateWidgets, [widgetId]: widget };

  // Save the layout
  yield put(updateAndSaveLayout(widgets));
}

function* batchUpdateWidgetPropertySaga(
  action: ReduxAction<UpdateWidgetPropertyPayload>,
) {
  const { updates, widgetId } = action.payload;
  if (!widgetId) {
    // Handling the case where sometimes widget id is not passed through here
    return;
  }
  const widget: WidgetProps = yield select(getWidget, widgetId);
  const triggerProperties = WidgetFactory.getWidgetTriggerPropertiesMap(
    widget.type,
  );
  const propertyUpdates: Record<string, unknown> = {};
  const currentDynamicTriggerPathList: DynamicPath[] = getWidgetDynamicTriggerPathList(
    widget,
  );
  const currentDynamicBindingPathList: DynamicPath[] = getEntityDynamicBindingPathList(
    widget,
  );
  const dynamicTriggerPathListUpdates: DynamicPathUpdate[] = [];
  const dynamicBindingPathListUpdates: DynamicPathUpdate[] = [];
  Object.entries(updates).forEach(([propertyPath, propertyValue]) => {
    // Set the actual property update
    propertyUpdates[propertyPath] = propertyValue;

    // Check if the path is a of a dynamic trigger property
    const isTriggerProperty = propertyPath in triggerProperties;
    // If it is a trigger property, it will go in a different list than the general
    // dynamicBindingPathList.
    if (isTriggerProperty && _.isString(propertyValue)) {
      dynamicTriggerPathListUpdates.push(
        getDynamicTriggerPathListUpdate(widget, propertyPath, propertyValue),
      );
    } else {
      dynamicBindingPathListUpdates.push(
        getDynamicBindingPathListUpdate(widget, propertyPath, propertyValue),
      );
    }
  });

  propertyUpdates.dynamicTriggerPathList = dynamicTriggerPathListUpdates.reduce(
    applyDynamicPathUpdates,
    currentDynamicTriggerPathList,
  );
  propertyUpdates.dynamicBindingPathList = dynamicBindingPathListUpdates.reduce(
    applyDynamicPathUpdates,
    currentDynamicBindingPathList,
  );

  // Send the updates
  yield put(updateWidgetProperty(widgetId, updates));

  const stateWidgets = yield select(getWidgets);
  const widgets = { ...stateWidgets, [widgetId]: widget };

  // Save the layout
  yield put(updateAndSaveLayout(widgets));
}

function* deleteWidgetPropertySaga(
  action: ReduxAction<DeleteWidgetPropertyPayload>,
) {
  const { widgetId, propertyPath } = action.payload;
  if (!widgetId) {
    // Handling the case where sometimes widget id is not passed through here
    return;
  }
  const stateWidget: WidgetProps = yield select(getWidget, widgetId);
  const dynamicTriggerPathList: DynamicPath[] = getWidgetDynamicTriggerPathList(
    stateWidget,
  );
  const dynamicBindingPathList: DynamicPath[] = getEntityDynamicBindingPathList(
    stateWidget,
  );

  dynamicTriggerPathList.filter((dynamicPath) => {
    return !isChildPropertyPath(propertyPath, dynamicPath.key);
  });

  dynamicBindingPathList.forEach((dynamicPath) => {
    return !isChildPropertyPath(propertyPath, dynamicPath.key);
  });

  yield put(
    updateWidgetProperty(widgetId, {
      dynamicTriggerPathList,
      dynamicBindingPathList,
    }),
  );

  const stateWidgets = yield select(getWidgets);
  const widget = { ...stateWidget };
  _.unset(widget, propertyPath);
  const widgets = { ...stateWidgets, [widgetId]: widget };

  // Save the layout
  yield put(updateAndSaveLayout(widgets));
}

function* getWidgetChildren(widgetId: string): any {
  const childrenIds: string[] = [];
  const widget = yield select(getWidget, widgetId);
  const { children } = widget;
  if (children && children.length) {
    for (const childIndex in children) {
      if (children.hasOwnProperty(childIndex)) {
        const child = children[childIndex];
        childrenIds.push(child);
        const grandChildren = yield call(getWidgetChildren, child);
        if (grandChildren.length) {
          childrenIds.push(...grandChildren);
        }
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

    // the widget was not found in the data tree, so don't do anything
    if (!widget) continue;

    const widgetToUpdate = { ...widget };
    const metaPropsMap = WidgetFactory.getWidgetMetaPropertiesMap(widget.type);
    const defaultPropertiesMap = WidgetFactory.getWidgetDefaultPropertiesMap(
      widget.type,
    );
    Object.keys(metaPropsMap).forEach((metaProp) => {
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
    yield put(
      updateWidgetProperty(canvasWidgetId, { bottomRow: newBottomRow }),
    );
  }
}

function* createWidgetCopy() {
  const selectedWidget = yield select(getSelectedWidget);
  if (!selectedWidget) return;
  const widgets = yield select(getWidgets);
  const widgetsToStore = getAllWidgetsInTree(selectedWidget.widgetId, widgets);
  return yield saveCopiedWidgets(
    JSON.stringify({ widgetId: selectedWidget.widgetId, list: widgetsToStore }),
  );
}

function* copyWidgetSaga(action: ReduxAction<{ isShortcut: boolean }>) {
  const selectedWidget = yield select(getSelectedWidget);
  if (!selectedWidget) {
    Toaster.show({
      text: `Please select a widget to copy`,
      variant: Variant.info,
    });
    return;
  }

  const saveResult = yield createWidgetCopy();

  const eventName = action.payload.isShortcut
    ? "WIDGET_COPY_VIA_SHORTCUT"
    : "WIDGET_COPY";
  AnalyticsUtil.logEvent(eventName, {
    widgetName: selectedWidget.widgetName,
    widgetType: selectedWidget.type,
  });

  if (saveResult) {
    Toaster.show({
      text: `Copied ${selectedWidget.widgetName}`,
      variant: Variant.success,
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
  const widgetNames = Object.keys(widgets).map((w) => widgets[w].widgetName);
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
    (widget) => widget.widgetId === copiedWidgetId,
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
        const { selectedTabWidgetId } = yield select(
          getWidgetMetaProps,
          parentWidget.widgetId,
        );
        if (selectedTabWidgetId) childWidget = widgets[selectedTabWidgetId];
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
    widgetList.forEach((widget) => {
      // Create a copy of the widget properties
      const newWidget = cloneDeep(widget);
      newWidget.widgetId = generateReactKey();
      // Add the new widget id so that it maps the previous widget id
      widgetIdMap[widget.widgetId] = newWidget.widgetId;
      // Add the new widget to the list
      newWidgetList.push(newWidget);
    });

    // For each of the new widgets generated
    newWidgetList.forEach((widget) => {
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
          const tabs = widget.tabs;
          if (Array.isArray(tabs)) {
            widget.tabs = tabs.map((tab) => {
              tab.widgetId = widgetIdMap[tab.widgetId];
              return tab;
            });
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
          (newWidget) => newWidget.widgetId === widgetIdMap[widget.parentId],
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
  const selectedWidget = yield select(getSelectedWidget);
  if (!selectedWidget) {
    Toaster.show({
      text: `Please select a widget to cut`,
      variant: Variant.info,
    });
    return;
  }

  const saveResult = yield createWidgetCopy();

  const eventName = "WIDGET_CUT_VIA_SHORTCUT"; // cut only supported through a shortcut
  AnalyticsUtil.logEvent(eventName, {
    widgetName: selectedWidget.widgetName,
    widgetType: selectedWidget.type,
  });

  if (saveResult) {
    Toaster.show({
      text: `Cut ${selectedWidget.widgetName}`,
      variant: Variant.success,
    });
  }

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
      props: {
        tableData: `{{${queryName}.data}}`,
        dynamicBindingPathList: [{ key: "tableData" }],
      },
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
  } catch (error) {
    Toaster.show({
      text: "Failed to add the widget",
      variant: Variant.danger,
    });
  }
}

// The following is computed to be used in the entity explorer
// Every time a widget is selected, we need to expand widget entities
// in the entity explorer so that the selected widget is visible
function* selectedWidgetAncestrySaga(
  action: ReduxAction<{ widgetId: string }>,
) {
  try {
    const canvasWidgets = yield select(getWidgets);
    const widgetIdsExpandList = [];
    const selectedWidget = action.payload.widgetId;

    // Make sure that the selected widget exists in canvasWidgets
    let widgetId = canvasWidgets[selectedWidget]
      ? canvasWidgets[selectedWidget].parentId
      : undefined;
    // If there is a parentId for the selectedWidget
    if (widgetId) {
      // Keep including the parent until we reach the main container
      while (widgetId !== MAIN_CONTAINER_WIDGET_ID) {
        widgetIdsExpandList.push(widgetId);
        if (canvasWidgets[widgetId] && canvasWidgets[widgetId].parentId)
          widgetId = canvasWidgets[widgetId].parentId;
        else break;
      }
    }
    yield put({
      type: ReduxActionTypes.SET_SELECTED_WIDGET_ANCESTORY,
      payload: widgetIdsExpandList,
    });
  } catch (error) {
    log.debug("Could not compute selected widget's ancestry", error);
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
    takeEvery(
      ReduxActionTypes.BATCH_UPDATE_WIDGET_PROPERTY,
      batchUpdateWidgetPropertySaga,
    ),
    takeEvery(
      ReduxActionTypes.DELETE_WIDGET_PROPERTY,
      deleteWidgetPropertySaga,
    ),
    takeLatest(ReduxActionTypes.UPDATE_CANVAS_SIZE, updateCanvasSize),
    takeLatest(ReduxActionTypes.COPY_SELECTED_WIDGET_INIT, copyWidgetSaga),
    takeEvery(ReduxActionTypes.PASTE_COPIED_WIDGET_INIT, pasteWidgetSaga),
    takeEvery(ReduxActionTypes.UNDO_DELETE_WIDGET, undoDeleteSaga),
    takeEvery(ReduxActionTypes.CUT_SELECTED_WIDGET, cutWidgetSaga),
    takeEvery(ReduxActionTypes.WIDGET_ADD_CHILDREN, addChildrenSaga),
    takeLatest(ReduxActionTypes.SELECT_WIDGET, selectedWidgetAncestrySaga),
  ]);
}
