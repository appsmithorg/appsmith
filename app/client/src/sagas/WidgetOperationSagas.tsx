import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "constants/ReduxActionConstants";
import {
  MultipleWidgetDeletePayload,
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
import { getSelectedWidget, getWidget, getWidgets } from "./selectors";
import {
  generateWidgetProps,
  updateWidgetPosition,
} from "utils/WidgetPropsUtils";
import {
  all,
  call,
  fork,
  put,
  select,
  takeEvery,
  takeLatest,
} from "redux-saga/effects";
import { convertToString, getNextEntityName } from "utils/AppsmithUtils";
import {
  batchUpdateWidgetProperty,
  DeleteWidgetPropertyPayload,
  SetWidgetDynamicPropertyPayload,
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
import _, { cloneDeep, flattenDeep, isString, set, remove } from "lodash";
import WidgetFactory from "utils/WidgetFactory";
import {
  buildWidgetBlueprint,
  executeWidgetBlueprintOperations,
  traverseTreeAndExecuteBlueprintChildOperations,
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
import WidgetConfigResponse, {
  GRID_DENSITY_MIGRATION_V1,
} from "mockResponses/WidgetConfigResponse";
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
import { navigateToCanvas } from "pages/Editor/Explorer/Widgets/utils";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import {
  closePropertyPane,
  forceOpenPropertyPane,
} from "actions/widgetActions";
import {
  selectMultipleWidgetsInitAction,
  selectWidgetInitAction,
} from "actions/widgetSelectionActions";

import { getDataTree } from "selectors/dataTreeSelectors";
import {
  clearEvalPropertyCacheOfWidget,
  validateProperty,
} from "./EvaluationsSaga";
import { WidgetBlueprint } from "reducers/entityReducers/widgetConfigReducer";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";
import { ColumnProperties } from "components/designSystems/appsmith/TableComponent/Constants";
import {
  getAllPathsFromPropertyConfig,
  nextAvailableRowInContainer,
} from "entities/Widget/utils";
import { getAllPaths } from "workers/evaluationUtils";
import {
  createMessage,
  ERROR_ADD_WIDGET_FROM_QUERY,
  ERROR_WIDGET_COPY_NO_WIDGET_SELECTED,
  ERROR_WIDGET_CUT_NO_WIDGET_SELECTED,
  WIDGET_COPY,
  WIDGET_CUT,
  WIDGET_DELETE,
  WIDGET_BULK_DELETE,
  ERROR_WIDGET_COPY_NOT_ALLOWED,
} from "constants/messages";
import AppsmithConsole from "utils/AppsmithConsole";
import { ENTITY_TYPE } from "entities/AppsmithConsole";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import {
  checkIfPastingIntoListWidget,
  doesTriggerPathsContainPropertyPath,
  getParentWidgetIdForPasting,
  getWidgetChildren,
  handleSpecificCasesWhilePasting,
} from "./WidgetOperationUtils";
import { getSelectedWidgets } from "selectors/ui";
import { getParentWithEnhancementFn } from "./WidgetEnhancementHelpers";
import { widgetSelectionSagas } from "./WidgetSelectionSagas";
function* getChildWidgetProps(
  parent: FlattenedWidgetProps,
  params: WidgetAddChild,
  widgets: { [widgetId: string]: FlattenedWidgetProps },
) {
  const { leftColumn, newWidgetId, props, topRow, type } = params;
  let { columns, parentColumnSpace, parentRowSpace, rows, widgetName } = params;
  let minHeight = undefined;
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const { blueprint = undefined, ...restDefaultConfig } = {
    ...(WidgetConfigResponse as any).config[type],
  };
  if (!widgetName) {
    const widgetNames = Object.keys(widgets).map((w) => widgets[w].widgetName);
    const entityNames = yield call(getEntityNames);

    widgetName = getNextEntityName(restDefaultConfig.widgetName, [
      ...widgetNames,
      ...entityNames,
    ]);
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
    restDefaultConfig.version,
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

  // deleting propertyPaneEnchancements too as it shouldn't go in dsl because
  // function can't be cloned into dsl

  // instead of passing whole enhancments function in widget props, we are just setting
  // enhancments as true so that we know this widget contains enhancments
  if ("enhancements" in widget) {
    widget.enhancements = true;
  }

  return { widgetId: widget.widgetId, widgets };
}

/**
 * this saga is called when we drop a widget on the canvas.
 *
 * @param addChildAction
 */
export function* addChildSaga(addChildAction: ReduxAction<WidgetAddChild>) {
  try {
    const start = performance.now();
    Toaster.clear();

    // NOTE: widgetId here is the parentId of the dropped widget ( we should rename it to avoid confusion )
    const { widgetId } = addChildAction.payload;
    // Get the current parent widget whose child will be the new widget.
    const stateParent: FlattenedWidgetProps = yield select(getWidget, widgetId);
    // const parent = Object.assign({}, stateParent);
    // Get all the widgets from the canvasWidgetsReducer
    const stateWidgets = yield select(getWidgets);
    let widgets = Object.assign({}, stateWidgets);
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
    AppsmithConsole.info({
      text: "Widget was created",
      source: {
        type: ENTITY_TYPE.WIDGET,
        id: childWidgetPayload.widgetId,
        name:
          childWidgetPayload.widgets[childWidgetPayload.widgetId].widgetName,
      },
    });
    log.debug("add child computations took", performance.now() - start, "ms");

    // some widgets need to update property of parent if the parent have CHILD_OPERATIONS
    // so here we are traversing up the tree till we get to MAIN_CONTAINER_WIDGET_ID
    // while travesring, if we find any widget which has CHILD_OPERATION, we will call the fn in it
    const updatedWidgets: {
      [widgetId: string]: FlattenedWidgetProps;
    } = yield call(
      traverseTreeAndExecuteBlueprintChildOperations,
      parent,
      addChildAction.payload.newWidgetId,
      widgets,
    );

    widgets = updatedWidgets;

    yield put({
      type: ReduxActionTypes.WIDGET_CHILD_ADDED,
      payload: {
        widgetId: childWidgetPayload.widgetId,
        type: addChildAction.payload.type,
      },
    });
    yield put(updateAndSaveLayout(widgets));

    // go up till MAIN_CONTAINER, if there is a operation CHILD_OPERATIONS IN ANY PARENT,
    // call execute
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
    const { children, widgetId } = addChildrenAction.payload;
    const stateWidgets = yield select(getWidgets);
    const widgets = { ...stateWidgets };
    const widgetNames = Object.keys(widgets).map((w) => widgets[w].widgetName);
    const entityNames = yield call(getEntityNames);

    children.forEach((child) => {
      // Create only if it doesn't already exist
      if (!widgets[child.widgetId]) {
        const defaultConfig: any = WidgetConfigResponse.config[child.type];
        const newWidgetName = getNextEntityName(defaultConfig.widgetName, [
          ...widgetNames,
          ...entityNames,
        ]);
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

  let lowestBottomRow = Math.ceil(
    (finalWidgets[parentId].minHeight || 0) /
      GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
  );
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

export function* deleteAllSelectedWidgetsSaga(
  deleteAction: ReduxAction<MultipleWidgetDeletePayload>,
) {
  try {
    const { disallowUndo = false, isShortcut } = deleteAction.payload;
    const stateWidgets = yield select(getWidgets);
    const widgets = { ...stateWidgets };
    const selectedWidgets: string[] = yield select(getSelectedWidgets);
    if (!(selectedWidgets && selectedWidgets.length !== 1)) return;
    const widgetsToBeDeleted = yield all(
      selectedWidgets.map((eachId) => {
        return call(getAllWidgetsInTree, eachId, widgets);
      }),
    );
    const falttendedWidgets: any = flattenDeep(widgetsToBeDeleted);
    const parentUpdatedWidgets = falttendedWidgets.reduce(
      (allWidgets: any, eachWidget: any) => {
        const { parentId, widgetId } = eachWidget;
        const stateParent: FlattenedWidgetProps = allWidgets[parentId];
        let parent = { ...stateParent };
        if (parent.children) {
          parent = {
            ...parent,
            children: parent.children.filter((c) => c !== widgetId),
          };
          allWidgets[parentId] = parent;
        }
        return allWidgets;
      },
      widgets,
    );
    const finalWidgets: CanvasWidgetsReduxState = _.omit(
      parentUpdatedWidgets,
      falttendedWidgets.map((widgets: any) => widgets.widgetId),
    );
    // assuming only widgets with same parent can be selected
    const parentId = widgets[selectedWidgets[0]].parentId;
    resizeCanvasToLowestWidget(finalWidgets, parentId);

    yield put(updateAndSaveLayout(finalWidgets));
    yield put(selectWidgetInitAction(""));
    const bulkDeleteKey = selectedWidgets.join(",");
    const saveStatus: boolean = yield saveDeletedWidgets(
      falttendedWidgets,
      bulkDeleteKey,
    );
    if (saveStatus && !disallowUndo) {
      // close property pane after delete
      yield put(closePropertyPane());
      Toaster.show({
        text: createMessage(WIDGET_BULK_DELETE, `${selectedWidgets.length}`),
        hideProgressBar: false,
        variant: Variant.success,
        dispatchableAction: {
          type: ReduxActionTypes.UNDO_DELETE_WIDGET,
          payload: {
            widgetId: bulkDeleteKey,
          },
        },
      });
      setTimeout(() => {
        if (bulkDeleteKey) {
          flushDeletedWidgets(bulkDeleteKey);
          AppsmithConsole.info({
            logType: LOG_TYPE.ENTITY_DELETED,
            text: `${selectedWidgets.length} were deleted`,
            source: {
              name: "Group Delete",
              type: ENTITY_TYPE.WIDGET,
              id: bulkDeleteKey,
            },
          });
        }
      }, WIDGET_DELETE_UNDO_TIMEOUT);
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

export function* deleteSagaInit(deleteAction: ReduxAction<WidgetDelete>) {
  const { widgetId } = deleteAction.payload;
  const selectedWidget = yield select(getSelectedWidget);
  const selectedWidgets: string[] = yield select(getSelectedWidgets);
  if (selectedWidgets.length > 1) {
    yield put({
      type: ReduxActionTypes.WIDGET_BULK_DELETE,
      payload: deleteAction.payload,
    });
  }
  if (!!widgetId || !!selectedWidget) {
    yield put({
      type: ReduxActionTypes.WIDGET_SINGLE_DELETE,
      payload: deleteAction.payload,
    });
  }
}

export function* deleteSaga(deleteAction: ReduxAction<WidgetDelete>) {
  try {
    let { parentId, widgetId } = deleteAction.payload;
    const { disallowUndo, isShortcut } = deleteAction.payload;

    if (!widgetId) {
      const selectedWidget = yield select(getSelectedWidget);
      if (!selectedWidget) return;

      // if widget is not deletable, don't don anything
      if (selectedWidget.isDeletable === false) return false;

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
      const saveStatus: boolean = yield saveDeletedWidgets(
        otherWidgetsToDelete,
        widgetId,
      );
      let widgetName = widget.widgetName;
      // SPECIAL HANDLING FOR TABS IN A TABS WIDGET
      if (parent.type === WidgetTypes.TABS_WIDGET && widget.tabName) {
        widgetName = widget.tabName;
      }
      if (saveStatus && !disallowUndo) {
        // close property pane after delete
        yield put(closePropertyPane());
        Toaster.show({
          text: createMessage(WIDGET_DELETE, widgetName),
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
          if (widgetId) {
            flushDeletedWidgets(widgetId);
            AppsmithConsole.info({
              logType: LOG_TYPE.ENTITY_DELETED,
              text: "Widget was deleted",
              source: {
                name: widgetName,
                type: ENTITY_TYPE.WIDGET,
                id: widgetId,
              },
            });
          }
        }, WIDGET_DELETE_UNDO_TIMEOUT);
      }

      yield call(clearEvalPropertyCacheOfWidget, widgetName);

      let finalWidgets: CanvasWidgetsReduxState = yield call(
        updateListWidgetPropertiesOnChildDelete,
        widgets,
        widgetId,
        widgetName,
      );

      finalWidgets = _.omit(
        finalWidgets,
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

/**
 * this saga clears out the enhancementMap, template and dynamicBindingPathList when a child
 * is deleted in list widget
 *
 * @param widgets
 * @param widgetId
 * @param widgetName
 * @param parentId
 */
export function* updateListWidgetPropertiesOnChildDelete(
  widgets: CanvasWidgetsReduxState,
  widgetId: string,
  widgetName: string,
) {
  const clone = JSON.parse(JSON.stringify(widgets));

  const parentWithEnhancementFn = getParentWithEnhancementFn(widgetId, clone);

  if (parentWithEnhancementFn?.type === "LIST_WIDGET") {
    const listWidget = parentWithEnhancementFn;

    // delete widget in template of list
    if (listWidget && widgetName in listWidget.template) {
      listWidget.template[widgetName] = undefined;
    }

    // delete dynamic binding path if any
    remove(listWidget?.dynamicBindingPathList || [], (path: any) =>
      path.key.startsWith(`template.${widgetName}`),
    );

    return clone;
  }

  return clone;
}

export function* undoDeleteSaga(action: ReduxAction<{ widgetId: string }>) {
  // Get the list of widget and its children which were deleted
  const deletedWidgets: FlattenedWidgetProps[] = yield getDeletedWidgets(
    action.payload.widgetId,
  );
  const deletedWidgetIds = action.payload.widgetId.split(",");
  if (deletedWidgets && Array.isArray(deletedWidgets)) {
    // Get the current list of widgets from reducer
    const formTree = deletedWidgets.reduce((widgetTree, each) => {
      widgetTree[each.widgetId] = each;
      return widgetTree;
    }, {} as CanvasWidgetsReduxState);
    const stateWidgets = yield select(getWidgets);
    const deletedWidgetGroups = deletedWidgetIds.map((each) => ({
      widget: formTree[each],
      widgetsToRestore: getAllWidgetsInTree(each, formTree),
    }));
    const finalWidgets = deletedWidgetGroups.reduce(
      (reducedWidgets, deletedWidgetGroup) => {
        const {
          widget: deletedWidget,
          widgetsToRestore: deletedWidgets,
        } = deletedWidgetGroup;
        let widgets = cloneDeep(reducedWidgets);

        // If the deleted widget is in fact available.
        if (deletedWidget) {
          // Log an undo event
          AnalyticsUtil.logEvent("WIDGET_DELETE_UNDO", {
            widgetName: deletedWidget.widgetName,
            widgetType: deletedWidget.type,
          });
        }

        // For each deleted widget
        deletedWidgets.forEach((widget: FlattenedWidgetProps) => {
          // Add it to the widgets list we fetched from reducer
          widgets[widget.widgetId] = widget;
          // If the widget in question is the deleted widget
          if (deletedWidgetIds.includes(widget.widgetId)) {
            //SPECIAL HANDLING FOR TAB IN A TABS WIDGET
            if (
              widget.tabId &&
              widget.type === WidgetTypes.CANVAS_WIDGET &&
              widget.parentId
            ) {
              const parent = cloneDeep(widgets[widget.parentId]);
              if (parent.tabsObj) {
                try {
                  const tabs = Object.values(parent.tabsObj);
                  parent.tabsObj[widget.tabId] = {
                    id: widget.tabId,
                    widgetId: widget.widgetId,
                    label: widget.tabName || widget.widgetName,
                    isVisible: true,
                  };
                  widgets = {
                    ...widgets,
                    [widget.parentId]: {
                      ...widgets[widget.parentId],
                      tabsObj: parent.tabsObj,
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
            if (widget.parentId && widgets[widget.parentId].children) {
              // Concatenate the list of parents children with the current widgetId
              newChildren = newChildren.concat(
                widgets[widget.parentId].children,
              );
            }
            if (widget.parentId) {
              widgets = {
                ...widgets,
                [widget.parentId]: {
                  ...widgets[widget.parentId],
                  children: newChildren,
                },
              };
            }
          }
        });
        return widgets;
      },
      stateWidgets,
    );
    const parentId = deletedWidgets[0].parentId;
    if (parentId) {
      resizeCanvasToLowestWidget(finalWidgets, parentId);
    }
    yield put(updateAndSaveLayout(finalWidgets));
    deletedWidgetIds.forEach((widgetId) => {
      setTimeout(() => flashElementById(widgetId), 100);
    });
    yield put(selectMultipleWidgetsInitAction(deletedWidgetIds));
    if (deletedWidgetIds.length === 1) {
      yield put(forceOpenPropertyPane(action.payload.widgetId));
    }
    yield flushDeletedWidgets(action.payload.widgetId);
  }
}

export function* moveSaga(moveAction: ReduxAction<WidgetMove>) {
  try {
    Toaster.clear();
    const start = performance.now();
    const {
      leftColumn,
      newParentId,
      parentId,
      topRow,
      widgetId,
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
      bottomRow,
      leftColumn,
      rightColumn,
      topRow,
      widgetId,
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

  //TODO(abhinav): This is not appropriate from the platform's archtecture's point of view.
  // Figure out a holistic solutions where we donot have to stringify above.
  if (propertyPath === "primaryColumns" || propertyPath === "derivedColumns") {
    return {
      propertyPath,
      effect: DynamicPathUpdateEffectEnum.NOOP,
    };
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
    currentList = _.reject(currentList, { key: update.propertyPath });
  }
  return currentList;
}

const isPropertyATriggerPath = (
  widget: WidgetProps,
  propertyPath: string,
): boolean => {
  const widgetConfig = WidgetFactory.getWidgetPropertyPaneConfig(widget.type);
  const { triggerPaths } = getAllPathsFromPropertyConfig(
    widget,
    widgetConfig,
    {},
  );
  return propertyPath in triggerPaths;
};

function* updateWidgetPropertySaga(
  updateAction: ReduxAction<UpdateWidgetPropertyRequestPayload>,
) {
  const {
    payload: { propertyPath, propertyValue, widgetId },
  } = updateAction;

  // Holder object to collect all updates
  const updates: Record<string, unknown> = {
    [propertyPath]: propertyValue,
  };
  // Push these updates via the batch update
  yield call(
    batchUpdateWidgetPropertySaga,
    batchUpdateWidgetProperty(widgetId, { modify: updates }),
  );
}

function* setWidgetDynamicPropertySaga(
  action: ReduxAction<SetWidgetDynamicPropertyPayload>,
) {
  const { isDynamic, propertyPath, widgetId } = action.payload;
  const stateWidget: WidgetProps = yield select(getWidget, widgetId);
  let widget = cloneDeep({ ...stateWidget });
  const propertyValue = _.get(widget, propertyPath);

  let dynamicPropertyPathList = getWidgetDynamicPropertyPathList(widget);
  if (isDynamic) {
    const keyExists =
      dynamicPropertyPathList.findIndex((path) => path.key === propertyPath) >
      -1;
    if (!keyExists) {
      dynamicPropertyPathList.push({
        key: propertyPath,
      });
    }
    widget = set(widget, propertyPath, convertToString(propertyValue));
  } else {
    dynamicPropertyPathList = _.reject(dynamicPropertyPathList, {
      key: propertyPath,
    });
    const { parsed } = yield call(
      validateProperty,
      propertyPath,
      propertyValue,
      widget,
    );
    widget = set(widget, propertyPath, parsed);
  }
  widget.dynamicPropertyPathList = dynamicPropertyPathList;

  const stateWidgets = yield select(getWidgets);
  const widgets = { ...stateWidgets, [widgetId]: widget };

  // Save the layout
  yield put(updateAndSaveLayout(widgets));
}

function getPropertiesToUpdate(
  widget: WidgetProps,
  updates: Record<string, unknown>,
  triggerPaths?: string[],
): {
  propertyUpdates: Record<string, unknown>;
  dynamicTriggerPathList: DynamicPath[];
  dynamicBindingPathList: DynamicPath[];
} {
  // Create a
  const widgetWithUpdates = _.cloneDeep(widget);
  Object.entries(updates).forEach(([propertyPath, propertyValue]) => {
    set(widgetWithUpdates, propertyPath, propertyValue);
  });

  // get the flat list of all updates (in case values are objects)
  const updatePaths = getAllPaths(updates);

  const propertyUpdates: Record<string, unknown> = {
    ...updates,
  };
  const currentDynamicTriggerPathList: DynamicPath[] = getWidgetDynamicTriggerPathList(
    widget,
  );
  const currentDynamicBindingPathList: DynamicPath[] = getEntityDynamicBindingPathList(
    widget,
  );
  const dynamicTriggerPathListUpdates: DynamicPathUpdate[] = [];
  const dynamicBindingPathListUpdates: DynamicPathUpdate[] = [];

  Object.keys(updatePaths).forEach((propertyPath) => {
    const propertyValue = _.get(updates, propertyPath);
    // only check if
    if (!_.isString(propertyValue)) {
      return;
    }

    // Check if the path is a of a dynamic trigger property
    let isTriggerProperty = isPropertyATriggerPath(
      widgetWithUpdates,
      propertyPath,
    );

    isTriggerProperty = doesTriggerPathsContainPropertyPath(
      isTriggerProperty,
      propertyPath,
      triggerPaths,
    );

    // If it is a trigger property, it will go in a different list than the general
    // dynamicBindingPathList.
    if (isTriggerProperty) {
      dynamicTriggerPathListUpdates.push(
        getDynamicTriggerPathListUpdate(widget, propertyPath, propertyValue),
      );
    } else {
      dynamicBindingPathListUpdates.push(
        getDynamicBindingPathListUpdate(widget, propertyPath, propertyValue),
      );
    }
  });

  const dynamicTriggerPathList = dynamicTriggerPathListUpdates.reduce(
    applyDynamicPathUpdates,
    currentDynamicTriggerPathList,
  );
  const dynamicBindingPathList = dynamicBindingPathListUpdates.reduce(
    applyDynamicPathUpdates,
    currentDynamicBindingPathList,
  );

  return {
    propertyUpdates,
    dynamicTriggerPathList,
    dynamicBindingPathList,
  };
}

function* batchUpdateWidgetPropertySaga(
  action: ReduxAction<UpdateWidgetPropertyPayload>,
) {
  const start = performance.now();
  const { updates, widgetId } = action.payload;
  if (!widgetId) {
    // Handling the case where sometimes widget id is not passed through here
    return;
  }
  const { modify = {}, remove = [], triggerPaths } = updates;

  const stateWidget: WidgetProps = yield select(getWidget, widgetId);

  // if there is no widget in the state, don't do anything
  if (!stateWidget) return;

  let widget = cloneDeep(stateWidget);
  try {
    if (Object.keys(modify).length > 0) {
      const {
        dynamicBindingPathList,
        dynamicTriggerPathList,
        propertyUpdates,
      } = getPropertiesToUpdate(widget, modify, triggerPaths);

      // We loop over all updates
      Object.entries(propertyUpdates).forEach(
        ([propertyPath, propertyValue]) => {
          // since property paths could be nested, we use lodash set method
          widget = set(widget, propertyPath, propertyValue);
        },
      );
      widget.dynamicBindingPathList = dynamicBindingPathList;
      widget.dynamicTriggerPathList = dynamicTriggerPathList;
    }
  } catch (e) {
    log.debug("Error updating property paths: ", { e });
  }

  if (Array.isArray(remove) && remove.length > 0) {
    widget = yield removeWidgetProperties(widget, remove);
  }

  const stateWidgets = yield select(getWidgets);
  const widgets = { ...stateWidgets, [widgetId]: widget };
  log.debug(
    "Batch widget property update calculations took: ",
    performance.now() - start,
    "ms",
  );

  // Save the layout
  yield put(updateAndSaveLayout(widgets));
}

function* removeWidgetProperties(widget: WidgetProps, paths: string[]) {
  try {
    let dynamicTriggerPathList: DynamicPath[] = getWidgetDynamicTriggerPathList(
      widget,
    );
    let dynamicBindingPathList: DynamicPath[] = getEntityDynamicBindingPathList(
      widget,
    );
    let dynamicPropertyPathList: DynamicPath[] = getWidgetDynamicPropertyPathList(
      widget,
    );

    paths.forEach((propertyPath) => {
      dynamicTriggerPathList = dynamicTriggerPathList.filter((dynamicPath) => {
        return !isChildPropertyPath(propertyPath, dynamicPath.key);
      });

      dynamicBindingPathList = dynamicBindingPathList.filter((dynamicPath) => {
        return !isChildPropertyPath(propertyPath, dynamicPath.key);
      });

      dynamicPropertyPathList = dynamicPropertyPathList.filter(
        (dynamicPath) => {
          return !isChildPropertyPath(propertyPath, dynamicPath.key);
        },
      );
    });

    widget.dynamicBindingPathList = dynamicBindingPathList;
    widget.dynamicTriggerPathList = dynamicTriggerPathList;
    widget.dynamicPropertyPathList = dynamicPropertyPathList;

    paths.forEach((propertyPath) => {
      widget = unsetPropertyPath(widget, propertyPath) as WidgetProps;
    });
  } catch (e) {
    log.debug("Error removing propertyPaths: ", { e });
  }

  return widget;
}

function* deleteWidgetPropertySaga(
  action: ReduxAction<DeleteWidgetPropertyPayload>,
) {
  const { propertyPaths, widgetId } = action.payload;
  if (!widgetId) {
    // Handling the case where sometimes widget id is not passed through here
    return;
  }

  yield put(batchUpdateWidgetProperty(widgetId, { remove: propertyPaths }));
}

//TODO(abhinav): Move this to helpers and add tests
const unsetPropertyPath = (obj: Record<string, unknown>, path: string) => {
  const regex = /(.*)\[\d+\]$/;
  if (regex.test(path)) {
    const matches = path.match(regex);
    if (
      matches &&
      Array.isArray(matches) &&
      matches[1] &&
      matches[1].length > 0
    ) {
      _.unset(obj, path);
      const arr = _.get(obj, matches[1]);
      if (arr && Array.isArray(arr)) {
        _.set(obj, matches[1], arr.filter(Boolean));
      }
    }
  } else {
    _.unset(obj, path);
  }
  return obj;
};

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
    yield put(
      batchUpdateWidgetProperty(canvasWidgetId, {
        modify: { bottomRow: newBottomRow },
      }),
    );
  }
}

function* createWidgetCopy(widget: FlattenedWidgetProps) {
  const allWidgets: { [widgetId: string]: FlattenedWidgetProps } = yield select(
    getWidgets,
  );
  const widgetsToStore = getAllWidgetsInTree(widget.widgetId, allWidgets);
  return {
    widgetId: widget.widgetId,
    list: widgetsToStore,
    parentId: widget.parentId,
  };
}

function* createSelectedWidgetsCopy(selectedWidgets: FlattenedWidgetProps[]) {
  if (!selectedWidgets || !selectedWidgets.length) return;
  const widgetListsToStore: {
    widgetId: string;
    parentId: string;
    list: FlattenedWidgetProps[];
  }[] = yield all(selectedWidgets.map((each) => call(createWidgetCopy, each)));
  return yield saveCopiedWidgets(JSON.stringify(widgetListsToStore));
}

/**
 * copy here actually means saving a JSON in local storage
 * so when a user hits copy on a selected widget, we save widget in localStorage
 *
 * @param action
 * @returns
 */
function* copyWidgetSaga(action: ReduxAction<{ isShortcut: boolean }>) {
  const allWidgets: { [widgetId: string]: FlattenedWidgetProps } = yield select(
    getWidgets,
  );
  const selectedWidgets: string[] = yield select(getSelectedWidgets);
  if (!selectedWidgets) {
    Toaster.show({
      text: createMessage(ERROR_WIDGET_COPY_NO_WIDGET_SELECTED),
      variant: Variant.info,
    });
    return;
  }

  const allAllowedToCopy = selectedWidgets.some((each) => {
    return !allWidgets[each].disallowCopy;
  });

  if (!allAllowedToCopy) {
    Toaster.show({
      text: createMessage(ERROR_WIDGET_COPY_NOT_ALLOWED),
      variant: Variant.info,
    });

    return;
  }
  const selectedWidgetProps = selectedWidgets.map((each) => allWidgets[each]);

  const saveResult = yield createSelectedWidgetsCopy(selectedWidgetProps);

  selectedWidgetProps.forEach((each) => {
    const eventName = action.payload.isShortcut
      ? "WIDGET_COPY_VIA_SHORTCUT"
      : "WIDGET_COPY";
    AnalyticsUtil.logEvent(eventName, {
      widgetName: each.widgetName,
      widgetType: each.type,
    });
  });

  if (saveResult) {
    Toaster.show({
      text: createMessage(
        WIDGET_COPY,
        selectedWidgetProps.length > 1
          ? `${selectedWidgetProps.length} Widgets`
          : selectedWidgetProps[0].widgetName,
      ),
      variant: Variant.success,
    });
  }
}

export function calculateNewWidgetPosition(
  widget: WidgetProps,
  parentId: string,
  canvasWidgets: { [widgetId: string]: FlattenedWidgetProps },
  parentBottomRow?: number,
  persistColumnPosition = false,
) {
  // Note: This is a very simple algorithm.
  // We take the bottom most widget in the canvas, then calculate the top,left,right,bottom
  // co-ordinates for the new widget, such that it can be placed at the bottom of the canvas.
  const nextAvailableRow = parentBottomRow
    ? parentBottomRow
    : nextAvailableRowInContainer(parentId, canvasWidgets);
  return {
    leftColumn: persistColumnPosition ? widget.leftColumn : 0,
    rightColumn: persistColumnPosition
      ? widget.rightColumn
      : widget.rightColumn - widget.leftColumn,
    topRow: parentBottomRow
      ? nextAvailableRow + widget.topRow
      : nextAvailableRow,
    bottomRow: parentBottomRow
      ? nextAvailableRow + widget.bottomRow
      : nextAvailableRow + (widget.bottomRow - widget.topRow),
  };
}

function* getEntityNames() {
  const evalTree = yield select(getDataTree);
  return Object.keys(evalTree);
}

function getNextWidgetName(
  widgets: CanvasWidgetsReduxState,
  type: WidgetType,
  evalTree: {
    bottomRow: any;
    leftColumn: any;
    rightColumn: any;
    topRow: any;
  },
  options?: Record<string, unknown>,
) {
  // Compute the new widget's name
  const defaultConfig: any = WidgetConfigResponse.config[type];
  const widgetNames = Object.keys(widgets).map((w) => widgets[w].widgetName);
  const entityNames = Object.keys(evalTree);
  let prefix = defaultConfig.widgetName;
  if (options && options.prefix) {
    prefix = `${options.prefix}${
      widgetNames.indexOf(options.prefix as string) > -1 ? "Copy" : ""
    }`;
  }

  return getNextEntityName(
    prefix,
    [...widgetNames, ...entityNames],
    options?.startWithoutIndex as boolean,
  );
}

/**
 * this saga create a new widget from the copied one to store
 */
function* pasteWidgetSaga() {
  const copiedWidgetGroups: {
    widgetId: string;
    parentId: string;
    list: WidgetProps[];
  }[] = yield getCopiedWidgets();
  if (!Array.isArray(copiedWidgetGroups)) {
    return;
    // to avoid invoking old copied widgets
  }
  const stateWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
  let selectedWidget: FlattenedWidgetProps | undefined = yield select(
    getSelectedWidget,
  );

  const pastingIntoWidgetId: string = yield getParentWidgetIdForPasting(
    { ...stateWidgets },
    selectedWidget,
  );

  selectedWidget = yield checkIfPastingIntoListWidget(selectedWidget);
  let widgets = { ...stateWidgets };
  const newlyCreatedWidgetIds: string[] = [];
  const sortedWidgetList = copiedWidgetGroups.sort(
    (a, b) => a.list[0].topRow - b.list[0].topRow,
  );
  const copiedGroupTopRow = sortedWidgetList[0].list[0].topRow;
  const nextAvailableRow: number = nextAvailableRowInContainer(
    pastingIntoWidgetId,
    widgets,
  );
  yield all(
    copiedWidgetGroups.map((copiedWidgets) =>
      call(function*() {
        // Don't try to paste if there is no copied widget
        if (!copiedWidgets) return;
        const copiedWidgetId = copiedWidgets.widgetId;
        const unUpdatedCopyOfWidget = copiedWidgets.list.find(
          (widget) => widget.widgetId === copiedWidgetId,
        );

        if (unUpdatedCopyOfWidget) {
          const copiedWidget = {
            ...unUpdatedCopyOfWidget,
            topRow: unUpdatedCopyOfWidget.topRow - copiedGroupTopRow,
            bottomRow: unUpdatedCopyOfWidget.bottomRow - copiedGroupTopRow,
          };

          // Log the paste event
          AnalyticsUtil.logEvent("WIDGET_PASTE", {
            widgetName: copiedWidget.widgetName,
            widgetType: copiedWidget.type,
          });

          // Compute the new widget's positional properties
          const {
            bottomRow,
            leftColumn,
            rightColumn,
            topRow,
          } = yield calculateNewWidgetPosition(
            copiedWidget,
            pastingIntoWidgetId,
            widgets,
            nextAvailableRow,
            true,
          );
          // goToNextAvailableRow = true,
          // persistColumnPosition = false,

          const evalTree = yield select(getDataTree);

          // Get a flat list of all the widgets to be updated
          const widgetList = copiedWidgets.list;
          const widgetIdMap: Record<string, string> = {};
          const widgetNameMap: Record<string, string> = {};
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
          for (let i = 0; i < newWidgetList.length; i++) {
            const widget = newWidgetList[i];
            const oldWidgetName = widget.widgetName;

            // Update the children widgetIds if it has children
            if (widget.children && widget.children.length > 0) {
              widget.children.forEach(
                (childWidgetId: string, index: number) => {
                  if (widget.children) {
                    widget.children[index] = widgetIdMap[childWidgetId];
                  }
                },
              );
            }

            // Update the tabs for the tabs widget.
            if (widget.tabsObj && widget.type === WidgetTypes.TABS_WIDGET) {
              try {
                const tabs = Object.values(widget.tabsObj);
                if (Array.isArray(tabs)) {
                  widget.tabsObj = tabs.reduce((obj: any, tab) => {
                    tab.widgetId = widgetIdMap[tab.widgetId];
                    obj[tab.id] = tab;
                    return obj;
                  }, {});
                }
              } catch (error) {
                log.debug("Error updating tabs", error);
              }
            }

            // Update the table widget column properties
            if (widget.type === WidgetTypes.TABLE_WIDGET) {
              try {
                const oldWidgetName = widget.widgetName;
                const newWidgetName = getNextWidgetName(
                  widgets,
                  widget.type,
                  evalTree,
                );
                // If the primaryColumns of the table exist
                if (widget.primaryColumns) {
                  // For each column
                  for (const [columnId, column] of Object.entries(
                    widget.primaryColumns,
                  )) {
                    // For each property in the column
                    for (const [key, value] of Object.entries(
                      column as ColumnProperties,
                    )) {
                      // Replace reference of previous widget with the new widgetName
                      // This handles binding scenarios like `{{Table2.tableData.map((currentRow) => (currentRow.id))}}`
                      widget.primaryColumns[columnId][key] = isString(value)
                        ? value.replace(
                            `${oldWidgetName}.`,
                            `${newWidgetName}.`,
                          )
                        : value;
                    }
                  }
                }
                // Use the new widget name we used to replace the column properties above.
                widget.widgetName = newWidgetName;
              } catch (error) {
                log.debug("Error updating table widget properties", error);
              }
            }

            // If it is the copied widget, update position properties
            if (widget.widgetId === widgetIdMap[copiedWidget.widgetId]) {
              newWidgetId = widget.widgetId;
              widget.leftColumn = leftColumn;
              widget.topRow = topRow;
              widget.bottomRow = bottomRow;
              widget.rightColumn = rightColumn;
              widget.parentId = pastingIntoWidgetId;
              // Also, update the parent widget in the canvas widgets
              // to include this new copied widget's id in the parent's children
              let parentChildren = [widget.widgetId];
              const widgetChildren = widgets[pastingIntoWidgetId].children;
              if (widgetChildren && Array.isArray(widgetChildren)) {
                // Add the new child to existing children
                parentChildren = parentChildren.concat(widgetChildren);
              }
              const updateBottomRow =
                widget.bottomRow * widget.parentRowSpace >
                widgets[pastingIntoWidgetId].bottomRow;
              widgets = {
                ...widgets,
                [pastingIntoWidgetId]: {
                  ...widgets[pastingIntoWidgetId],
                  ...(updateBottomRow
                    ? {
                        bottomRow: widget.bottomRow * widget.parentRowSpace,
                      }
                    : {}),
                  children: parentChildren,
                },
              };
              // If the copied widget's boundaries exceed the parent's
              // Make the parent scrollable
              if (
                widgets[pastingIntoWidgetId].bottomRow *
                  widgets[widget.parentId].parentRowSpace <=
                widget.bottomRow * widget.parentRowSpace
              ) {
                const parentOfPastingWidget =
                  widgets[pastingIntoWidgetId].parentId;
                if (
                  parentOfPastingWidget &&
                  widget.parentId !== MAIN_CONTAINER_WIDGET_ID
                ) {
                  const parent = widgets[parentOfPastingWidget];
                  widgets[parentOfPastingWidget] = {
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
              const newParentId = newWidgetList.find((newWidget) =>
                widget.parentId
                  ? newWidget.widgetId === widgetIdMap[widget.parentId]
                  : false,
              )?.widgetId;
              if (newParentId) widget.parentId = newParentId;
            }
            // Generate a new unique widget name
            widget.widgetName = getNextWidgetName(
              widgets,
              widget.type,
              evalTree,
              {
                prefix: oldWidgetName,
                startWithoutIndex: true,
              },
            );
            widgetNameMap[oldWidgetName] = widget.widgetName;
            // Add the new widget to the canvas widgets
            widgets[widget.widgetId] = widget;
          }
          newlyCreatedWidgetIds.push(widgetIdMap[copiedWidgetId]);
          // 1. updating template in the copied widget and deleting old template associations
          // 2. updating dynamicBindingPathList in the copied grid widget
          for (let i = 0; i < newWidgetList.length; i++) {
            const widget = newWidgetList[i];

            widgets = handleSpecificCasesWhilePasting(
              widget,
              widgets,
              widgetNameMap,
              newWidgetList,
            );
          }
        }
      }),
    ),
  );
  // save the new DSL
  yield put(updateAndSaveLayout(widgets));
  newlyCreatedWidgetIds.forEach((newWidgetId) => {
    setTimeout(() => flashElementById(newWidgetId), 100);
  });
  // hydrating enhancements map after save layout so that enhancement map
  // for newly copied widget is hydrated
  yield put(selectMultipleWidgetsInitAction(newlyCreatedWidgetIds));
}

function* cutWidgetSaga() {
  const allWidgets: { [widgetId: string]: FlattenedWidgetProps } = yield select(
    getWidgets,
  );
  const selectedWidgets: string[] = yield select(getSelectedWidgets);
  if (!selectedWidgets) {
    Toaster.show({
      text: createMessage(ERROR_WIDGET_CUT_NO_WIDGET_SELECTED),
      variant: Variant.info,
    });
    return;
  }

  const selectedWidgetProps = selectedWidgets.map((each) => allWidgets[each]);

  const saveResult = yield createSelectedWidgetsCopy(selectedWidgetProps);

  selectedWidgetProps.forEach((each) => {
    const eventName = "WIDGET_CUT_VIA_SHORTCUT"; // cut only supported through a shortcut
    AnalyticsUtil.logEvent(eventName, {
      widgetName: each.widgetName,
      widgetType: each.type,
    });
  });

  if (saveResult) {
    Toaster.show({
      text: createMessage(
        WIDGET_CUT,
        selectedWidgetProps.length > 1
          ? `${selectedWidgetProps.length} Widgets`
          : selectedWidgetProps[0].widgetName,
      ),
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
    const columns = 8 * GRID_DENSITY_MIGRATION_V1;
    const rows = 7 * GRID_DENSITY_MIGRATION_V1;
    const queryName = action.payload;
    const widgets = yield select(getWidgets);
    const evalTree = yield select(getDataTree);
    const widgetName = getNextWidgetName(widgets, "TABLE_WIDGET", evalTree);

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
      parentId: MAIN_CONTAINER_WIDGET_ID,
      widgetName,
      renderMode: RenderModes.CANVAS,
      parentRowSpace: GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
      parentColumnSpace: 1,
      isLoading: false,
      version: 1,
      props: {
        tableData: `{{${queryName}.data}}`,
        dynamicBindingPathList: [{ key: "tableData" }],
      },
    };
    const {
      bottomRow,
      leftColumn,
      rightColumn,
      topRow,
    } = yield calculateNewWidgetPosition(
      newWidget,
      MAIN_CONTAINER_WIDGET_ID,
      widgets,
    );

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
      type: ReduxActionTypes.SELECT_WIDGET_INIT,
      payload: { widgetId: newWidget.newWidgetId },
    });
    yield put(forceOpenPropertyPane(newWidget.newWidgetId));
  } catch (error) {
    Toaster.show({
      text: createMessage(ERROR_ADD_WIDGET_FROM_QUERY),
      variant: Variant.danger,
    });
  }
}

export default function* widgetOperationSagas() {
  yield fork(widgetSelectionSagas);
  yield all([
    takeEvery(
      ReduxActionTypes.ADD_TABLE_WIDGET_FROM_QUERY,
      addTableWidgetFromQuerySaga,
    ),
    takeEvery(ReduxActionTypes.WIDGET_ADD_CHILD, addChildSaga),
    takeEvery(ReduxActionTypes.WIDGET_DELETE, deleteSagaInit),
    takeEvery(ReduxActionTypes.WIDGET_SINGLE_DELETE, deleteSaga),
    takeEvery(
      ReduxActionTypes.WIDGET_BULK_DELETE,
      deleteAllSelectedWidgetsSaga,
    ),
    takeLatest(ReduxActionTypes.WIDGET_MOVE, moveSaga),
    takeLatest(ReduxActionTypes.WIDGET_RESIZE, resizeSaga),
    takeEvery(
      ReduxActionTypes.UPDATE_WIDGET_PROPERTY_REQUEST,
      updateWidgetPropertySaga,
    ),
    takeEvery(
      ReduxActionTypes.WIDGET_UPDATE_PROPERTY,
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
  ]);
}
