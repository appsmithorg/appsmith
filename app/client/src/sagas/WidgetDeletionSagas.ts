import {
  MultipleWidgetDeletePayload,
  updateAndSaveLayout,
  WidgetDelete,
} from "actions/pageActions";
import {
  closePropertyPane,
  closeTableFilterPane,
  forceOpenPropertyPane,
} from "actions/widgetActions";
import {
  selectMultipleWidgetsInitAction,
  selectWidgetInitAction,
} from "actions/widgetSelectionActions";
import { Variant } from "components/ads/common";
import { Toaster } from "components/ads/Toast";
import {
  createMessage,
  WIDGET_BULK_DELETE,
  WIDGET_DELETE,
} from "constants/messages";
import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
  WidgetReduxActionTypes,
} from "constants/ReduxActionConstants";
import {
  GridDefaults,
  WidgetTypes,
  WIDGET_DELETE_UNDO_TIMEOUT,
} from "constants/WidgetConstants";
import { ENTITY_TYPE } from "entities/AppsmithConsole";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import { cloneDeep, flattenDeep, omit, remove } from "lodash";
import {
  CanvasWidgetsReduxState,
  FlattenedWidgetProps,
} from "reducers/entityReducers/canvasWidgetsReducer";
import { all, call, put, select, takeEvery } from "redux-saga/effects";
import { getSelectedWidgets } from "selectors/ui";
import AnalyticsUtil from "utils/AnalyticsUtil";
import AppsmithConsole from "utils/AppsmithConsole";
import {
  flushDeletedWidgets,
  getDeletedWidgets,
  saveDeletedWidgets,
} from "utils/storage";
import { WidgetProps } from "widgets/BaseWidget";
import { clearEvalPropertyCacheOfWidget } from "./EvaluationsSaga";
import { getSelectedWidget, getWidget, getWidgets } from "./selectors";
import { getParentWithEnhancementFn } from "./WidgetEnhancementHelpers";
import { getAllWidgetsInTree } from "./WidgetOperationUtils";
import log from "loglevel";
import { flashElementsById } from "utils/helpers";

type WidgetDeleteTabChild = {
  id: string;
  index: number;
  isVisible: boolean;
  label: string;
  widgetId: string;
};

/**
 * this saga clears out the enhancementMap, template and dynamicBindingPathList when a child
 * is deleted in list widget
 *
 * @param widgets
 * @param widgetId
 * @param widgetName
 * @param parentId
 */
function* updateListWidgetPropertiesOnChildDelete(
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
function* deleteTabChildSaga(
  deleteChildTabAction: ReduxAction<WidgetDeleteTabChild>,
) {
  const { index, label, widgetId } = deleteChildTabAction.payload;
  const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
  const tabWidget = allWidgets[widgetId];
  if (tabWidget && tabWidget.parentId) {
    const tabParentWidget = allWidgets[tabWidget.parentId];
    const tabsArray: any = Object.values(tabParentWidget.tabsObj);
    if (tabsArray && tabsArray.length === 1) return;
    const updatedArray = tabsArray.filter((eachItem: any, i: number) => {
      return i !== index;
    });
    const updatedObj = updatedArray.reduce(
      (obj: any, each: any, index: number) => {
        obj[each.id] = {
          ...each,
          index,
        };
        return obj;
      },
      {},
    );
    const updatedDslObj: UpdatedDSLPostDelete = yield call(
      getUpdatedDslAfterDeletingWidget,
      widgetId,
      tabWidget.parentId,
    );
    if (updatedDslObj) {
      const { finalWidgets, otherWidgetsToDelete } = updatedDslObj;
      const parentUpdatedWidgets = {
        ...finalWidgets,
        [tabParentWidget.widgetId]: {
          ...finalWidgets[tabParentWidget.widgetId],
          tabsObj: updatedObj,
        },
      };
      yield put(updateAndSaveLayout(parentUpdatedWidgets));
      yield call(initUndoDelete, widgetId, label, otherWidgetsToDelete);
    }
  }
}

function* deleteSagaInit(deleteAction: ReduxAction<WidgetDelete>) {
  const { widgetId } = deleteAction.payload;
  const selectedWidget = yield select(getSelectedWidget);
  const selectedWidgets: string[] = yield select(getSelectedWidgets);
  if (selectedWidgets.length > 1) {
    yield put({
      type: WidgetReduxActionTypes.WIDGET_BULK_DELETE,
      payload: deleteAction.payload,
    });
  }
  if (!!widgetId || !!selectedWidget) {
    yield put({
      type: WidgetReduxActionTypes.WIDGET_SINGLE_DELETE,
      payload: deleteAction.payload,
    });
  }
}

type UpdatedDSLPostDelete =
  | {
      finalWidgets: CanvasWidgetsReduxState;
      otherWidgetsToDelete: (WidgetProps & {
        children?: string[] | undefined;
      })[];
      saveStatus: boolean;
      widgetName: string;
    }
  | undefined;

function* getUpdatedDslAfterDeletingWidget(widgetId: string, parentId: string) {
  const stateWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
  if (widgetId && parentId) {
    const widgets = { ...stateWidgets };
    const stateWidget: WidgetProps = yield select(getWidget, widgetId);
    const widget = { ...stateWidget };

    const stateParent: FlattenedWidgetProps = yield select(getWidget, parentId);
    let parent = { ...stateParent };

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

    yield call(clearEvalPropertyCacheOfWidget, widgetName);

    let finalWidgets: CanvasWidgetsReduxState = yield call(
      updateListWidgetPropertiesOnChildDelete,
      widgets,
      widgetId,
      widgetName,
    );

    finalWidgets = omit(
      finalWidgets,
      otherWidgetsToDelete.map((widgets) => widgets.widgetId),
    );

    // Note: mutates finalWidgets
    resizeCanvasToLowestWidget(finalWidgets, parentId);
    return {
      finalWidgets,
      otherWidgetsToDelete,
      saveStatus,
      widgetName,
    } as UpdatedDSLPostDelete;
  }
}

function* deleteSaga(deleteAction: ReduxAction<WidgetDelete>) {
  try {
    let { parentId, widgetId } = deleteAction.payload;
    const { disallowUndo, isShortcut } = deleteAction.payload;

    if (!widgetId) {
      const selectedWidget: FlattenedWidgetProps | undefined = yield select(
        getSelectedWidget,
      );
      if (!selectedWidget) return;

      // if widget is not deletable, don't don anything
      if (selectedWidget.isDeletable === false) return false;

      widgetId = selectedWidget.widgetId;
      parentId = selectedWidget.parentId;
    }

    if (widgetId && parentId) {
      const stateWidget: WidgetProps = yield select(getWidget, widgetId);
      const widget = { ...stateWidget };
      const updatedObj: UpdatedDSLPostDelete = yield call(
        getUpdatedDslAfterDeletingWidget,
        widgetId,
        parentId,
      );
      if (updatedObj) {
        const {
          finalWidgets,
          otherWidgetsToDelete,
          saveStatus,
          widgetName,
        } = updatedObj;
        yield put(updateAndSaveLayout(finalWidgets));
        const analyticsEvent = isShortcut
          ? "WIDGET_DELETE_VIA_SHORTCUT"
          : "WIDGET_DELETE";

        AnalyticsUtil.logEvent(analyticsEvent, {
          widgetName: widget.widgetName,
          widgetType: widget.type,
        });
        if (saveStatus && !disallowUndo) {
          // close property pane after delete
          yield put(closePropertyPane());
          yield call(
            initUndoDelete,
            widgetId,
            widgetName,
            otherWidgetsToDelete,
          );
        }
      }
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.WIDGET_OPERATION_ERROR,
      payload: {
        action: WidgetReduxActionTypes.WIDGET_DELETE,
        error,
      },
    });
  }
}

function* deleteAllSelectedWidgetsSaga(
  deleteAction: ReduxAction<MultipleWidgetDeletePayload>,
) {
  try {
    const { disallowUndo = false } = deleteAction.payload;
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
    const finalWidgets: CanvasWidgetsReduxState = omit(
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
      yield put(closeTableFilterPane());
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
          falttendedWidgets.map((widget: any) => {
            AppsmithConsole.info({
              logType: LOG_TYPE.ENTITY_DELETED,
              text: "Widget was deleted",
              source: {
                name: widget.widgetName,
                type: ENTITY_TYPE.WIDGET,
                id: widget.widgetId,
              },
              analytics: {
                widgetType: widget.type,
              },
            });
          });
        }
      }, WIDGET_DELETE_UNDO_TIMEOUT);
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.WIDGET_OPERATION_ERROR,
      payload: {
        action: WidgetReduxActionTypes.WIDGET_DELETE,
        error,
      },
    });
  }
}

function* initUndoDelete(
  widgetId: string,
  widgetName: string,
  otherWidgetsToDelete: (WidgetProps & {
    children?: string[] | undefined;
  })[],
) {
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
      otherWidgetsToDelete.map((widget) => {
        AppsmithConsole.info({
          logType: LOG_TYPE.ENTITY_DELETED,
          text: "Widget was deleted",
          source: {
            name: widget.widgetName,
            type: ENTITY_TYPE.WIDGET,
            id: widget.widgetId,
          },
          analytics: {
            widgetType: widget.type,
          },
        });
      });
    }
  }, WIDGET_DELETE_UNDO_TIMEOUT);
}

function* undoDeleteSaga(action: ReduxAction<{ widgetId: string }>) {
  // Get the list of widget and its children which were deleted
  const deletedWidgets: FlattenedWidgetProps[] = yield getDeletedWidgets(
    action.payload.widgetId,
  );
  const stateWidgets = yield select(getWidgets);
  const deletedWidgetIds = action.payload.widgetId.split(",");
  if (
    deletedWidgets &&
    Array.isArray(deletedWidgets) &&
    deletedWidgets.length
  ) {
    // Get the current list of widgets from reducer
    const formTree = deletedWidgets.reduce((widgetTree, each) => {
      widgetTree[each.widgetId] = each;
      return widgetTree;
    }, {} as CanvasWidgetsReduxState);
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
              widget.parentId &&
              widgets[widget.parentId]
            ) {
              const parent = cloneDeep(widgets[widget.parentId]);
              if (parent.tabsObj) {
                try {
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
            if (widget.parentId && widgets[widget.parentId]) {
              if (widgets[widget.parentId].children) {
                // Concatenate the list of parents children with the current widgetId
                newChildren = newChildren.concat(
                  widgets[widget.parentId].children,
                );
              }
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
    flashElementsById(deletedWidgetIds, 100);
    yield put(selectMultipleWidgetsInitAction(deletedWidgetIds));
    if (deletedWidgetIds.length === 1) {
      yield put(forceOpenPropertyPane(action.payload.widgetId));
    }
    yield flushDeletedWidgets(action.payload.widgetId);
  }
}

/**
 * Note: Mutates finalWidgets[parentId].bottomRow for CANVAS_WIDGET
 * @param finalWidgets
 * @param parentId
 */
function resizeCanvasToLowestWidget(
  finalWidgets: CanvasWidgetsReduxState,
  parentId: string,
) {
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
}

export default function* widgetDeletionSagas() {
  yield all([
    takeEvery(WidgetReduxActionTypes.WIDGET_DELETE, deleteSagaInit),
    takeEvery(WidgetReduxActionTypes.WIDGET_SINGLE_DELETE, deleteSaga),
    takeEvery(
      WidgetReduxActionTypes.WIDGET_BULK_DELETE,
      deleteAllSelectedWidgetsSaga,
    ),
    takeEvery(ReduxActionTypes.WIDGET_DELETE_TAB_CHILD, deleteTabChildSaga),
    takeEvery(ReduxActionTypes.UNDO_DELETE_WIDGET, undoDeleteSaga),
  ]);
}
