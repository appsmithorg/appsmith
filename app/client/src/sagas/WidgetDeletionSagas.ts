import { generateAutoHeightLayoutTreeAction } from "actions/autoHeightActions";
import type {
  MultipleWidgetDeletePayload,
  WidgetDelete,
} from "actions/pageActions";
import { closePropertyPane, closeTableFilterPane } from "actions/widgetActions";
import { selectWidgetInitAction } from "actions/widgetSelectionActions";
import type { ReduxAction } from "constants/ReduxActionTypes";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
  WidgetReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import { ENTITY_TYPE } from "ee/entities/AppsmithConsole/utils";
import { widgetURL } from "ee/RouteBuilder";
import { getCurrentApplication } from "ee/selectors/applicationSelectors";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import type { ApplicationPayload } from "entities/Application";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import { getIsAnvilLayout } from "layoutSystems/anvil/integrations/selectors";
import { updateAndSaveAnvilLayout } from "layoutSystems/anvil/utils/anvilChecksUtils";
import { updateAnvilParentPostWidgetDeletion } from "layoutSystems/anvil/utils/layouts/update/deletionUtils";
import { LayoutSystemTypes } from "layoutSystems/types";
import { flattenDeep, omit, orderBy } from "lodash";
import type {
  CanvasWidgetsReduxState,
  FlattenedWidgetProps,
} from "reducers/entityReducers/canvasWidgetsReducer";
import { all, call, put, select, takeEvery } from "redux-saga/effects";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import {
  getCanvasWidth,
  getIsAutoLayoutMobileBreakPoint,
} from "selectors/editorSelectors";
import { getLayoutSystemType } from "selectors/layoutSystemSelectors";
import { getSelectedWidgets } from "selectors/ui";
import AppsmithConsole from "utils/AppsmithConsole";
import { showUndoRedoToast } from "utils/replayHelpers";
import WidgetFactory from "WidgetProvider/factory";
import type { WidgetProps } from "widgets/BaseWidget";
import type { DraggedWidget } from "../layoutSystems/anvil/utils/anvilTypes";
import { severTiesFromParents } from "../layoutSystems/anvil/utils/layouts/update/moveUtils";
import {
  isRedundantZoneWidget,
  isZoneWidget,
} from "../layoutSystems/anvil/utils/layouts/update/zoneUtils";
import { widgetChildren } from "../layoutSystems/anvil/utils/layouts/widgetUtils";
import { updateFlexLayersOnDelete } from "../layoutSystems/autolayout/utils/AutoLayoutUtils";
import FocusRetention from "./FocusRetentionSaga";
import {
  getSelectedWidget,
  getWidget,
  getWidgets,
  getWidgetsMeta,
} from "./selectors";
import type { WidgetsInTree } from "./WidgetOperationUtils";
import {
  getAllWidgetsInTree,
  updateListWidgetPropertiesOnChildDelete,
} from "./WidgetOperationUtils";

const WidgetTypes = WidgetFactory.widgetTypes;

interface WidgetDeleteTabChild {
  id: string;
  index: number;
  isVisible: boolean;
  label: string;
  widgetId: string;
}

function* deleteTabChildSaga(
  deleteChildTabAction: ReduxAction<WidgetDeleteTabChild>,
) {
  const { index, label, widgetId } = deleteChildTabAction.payload;
  const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
  const tabWidget = allWidgets[widgetId];

  if (tabWidget && tabWidget.parentId) {
    const tabParentWidget = allWidgets[tabWidget.parentId];
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tabsArray: any = orderBy(
      Object.values(tabParentWidget.tabsObj),
      "index",
      "asc",
    );

    if (tabsArray && tabsArray.length === 1) return;

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatedArray = tabsArray.filter((eachItem: any, i: number) => {
      return i !== index;
    });
    const updatedObj = updatedArray.reduce(
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (obj: any, each: any, index: number) => {
        obj[each.id] = {
          ...each,
          index,
        };

        return obj;
      },
      {},
    );
    const widgetType: string = allWidgets[widgetId].type;
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
      const layoutSystemType: LayoutSystemTypes =
        yield select(getLayoutSystemType);
      const isAnvilLayout: boolean = yield select(getIsAnvilLayout);
      let finalData: CanvasWidgetsReduxState = parentUpdatedWidgets;

      if (layoutSystemType === LayoutSystemTypes.AUTO) {
        // Update flex layers of a canvas upon deletion of a widget.
        const isMobile: boolean = yield select(getIsAutoLayoutMobileBreakPoint);
        const mainCanvasWidth: number = yield select(getCanvasWidth);
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const metaProps: Record<string, any> = yield select(getWidgetsMeta);

        finalData = yield call(
          updateFlexLayersOnDelete,
          parentUpdatedWidgets,
          widgetId,
          tabWidget.parentId,
          isMobile,
          mainCanvasWidth,
          metaProps,
        );
      } else if (isAnvilLayout) {
        finalData = updateAnvilParentPostWidgetDeletion(
          finalData,
          tabWidget.parentId,
          widgetId,
          widgetType,
        );
      }

      yield call(updateAndSaveAnvilLayout, finalData);
      yield call(postDelete, widgetId, label, otherWidgetsToDelete);
    }
  }
}

function* deleteSagaInit(deleteAction: ReduxAction<WidgetDelete>) {
  const { widgetId } = deleteAction.payload;
  const selectedWidget: FlattenedWidgetProps | undefined =
    yield select(getSelectedWidget);
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
    let widgetName = widget.widgetName;

    // SPECIAL HANDLING FOR TABS IN A TABS WIDGET
    if (parent.type === WidgetTypes.TABS_WIDGET && widget.tabName) {
      widgetName = widget.tabName;
    }

    let finalWidgets: CanvasWidgetsReduxState =
      updateListWidgetPropertiesOnChildDelete(widgets, widgetId, widgetName);

    finalWidgets = omit(
      finalWidgets,
      otherWidgetsToDelete.map((widgets) => widgets.widgetId),
    );

    return {
      finalWidgets,
      otherWidgetsToDelete,
      widgetName,
    } as UpdatedDSLPostDelete;
  }
}

export function* deleteSaga(deleteAction: ReduxAction<WidgetDelete>) {
  try {
    let { parentId, widgetId } = deleteAction.payload;

    const { disallowUndo, isShortcut } = deleteAction.payload;

    if (!widgetId) {
      const selectedWidget: FlattenedWidgetProps | undefined =
        yield select(getSelectedWidget);

      if (!selectedWidget) return;

      // if widget is not deletable, don't do anything
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

      /**
       * This change ensures that meta widgets are deleted before the main widget.
       * By handling meta widget deletion within the deleteWidget saga, we prevent
       * lint evaluation from detecting orphaned meta widgets, which previously
       * caused errors in the in-app debugger. This resolves the issue of transient
       * errors appearing after widget deletion.
       *
       * For more details, refer to the PR: https://github.com/appsmithorg/appsmith/pull/35820
       */
      if (widget.hasMetaWidgets) {
        yield put({
          type: ReduxActionTypes.DELETE_META_WIDGETS,
          payload: {
            creatorIds: [widgetId],
          },
        });
      }

      if (updatedObj) {
        const { finalWidgets, otherWidgetsToDelete, widgetName } = updatedObj;
        const layoutSystemType: LayoutSystemTypes =
          yield select(getLayoutSystemType);
        const isAnvilLayout: boolean = yield select(getIsAnvilLayout);
        let finalData: CanvasWidgetsReduxState = finalWidgets;

        if (layoutSystemType === LayoutSystemTypes.AUTO) {
          const isMobile: boolean = yield select(
            getIsAutoLayoutMobileBreakPoint,
          );
          const mainCanvasWidth: number = yield select(getCanvasWidth);
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const metaProps: Record<string, any> = yield select(getWidgetsMeta);

          // Update flex layers of a canvas upon deletion of a widget.
          finalData = updateFlexLayersOnDelete(
            finalWidgets,
            widgetId,
            parentId,
            isMobile,
            mainCanvasWidth,
            metaProps,
          );
        } else if (isAnvilLayout) {
          finalData = updateAnvilParentPostWidgetDeletion(
            finalData,
            parentId,
            widgetId,
            widget.type,
          );

          finalData = handleDeleteRedundantZones(
            finalData,
            otherWidgetsToDelete,
          );
        }

        yield call(updateAndSaveAnvilLayout, finalData);
        yield put(generateAutoHeightLayoutTreeAction(true, true));

        const currentApplication: ApplicationPayload = yield select(
          getCurrentApplication,
        );
        const analyticsEvent = isShortcut
          ? "WIDGET_DELETE_VIA_SHORTCUT"
          : "WIDGET_DELETE";

        AnalyticsUtil.logEvent(analyticsEvent, {
          widgetName: widget.widgetName,
          widgetType: widget.type,
          templateTitle: currentApplication?.forkedFromTemplateTitle,
        });
        const currentUrl = window.location.pathname;

        yield call(FocusRetention.handleRemoveFocusHistory, currentUrl);

        if (!disallowUndo) {
          // close property pane after delete
          yield put(closePropertyPane());

          if (isAnvilLayout) {
            yield put(
              selectWidgetInitAction(
                SelectionRequestType.Unselect,
                [widgetId],
                undefined,
                undefined,
                parentId,
              ),
            );
          } else {
            yield put(
              selectWidgetInitAction(SelectionRequestType.Unselect, [widgetId]),
            );
          }

          yield call(postDelete, widgetId, widgetName, otherWidgetsToDelete);
        }
      }
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.WIDGET_OPERATION_ERROR,
      payload: {
        action: WidgetReduxActionTypes.WIDGET_DELETE,
        error,
        logToDebugger: true,
      },
    });
  }
}

function* deleteAllSelectedWidgetsSaga(
  deleteAction: ReduxAction<MultipleWidgetDeletePayload>,
) {
  try {
    const { disallowUndo = false } = deleteAction.payload;
    const stateWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
    const widgets = { ...stateWidgets };
    const selectedWidgets: string[] = yield select(getSelectedWidgets);

    if (!(selectedWidgets && selectedWidgets.length !== 1)) return;

    const widgetsToBeDeleted: WidgetsInTree = yield all(
      selectedWidgets.map((eachId) => {
        return call(getAllWidgetsInTree, eachId, widgets);
      }),
    );
    const flattenedWidgets = flattenDeep(widgetsToBeDeleted);

    const parentUpdatedWidgets = flattenedWidgets.reduce(
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      flattenedWidgets.map((widgets: any) => widgets.widgetId),
    );
    let finalData = finalWidgets;
    // assuming only widgets with same parent can be selected
    const parentId = widgets[selectedWidgets[0]].parentId;

    if (parentId) {
      const layoutSystemType: LayoutSystemTypes =
        yield select(getLayoutSystemType);
      const isAnvilLayout: boolean = yield select(getIsAnvilLayout);

      if (layoutSystemType === LayoutSystemTypes.AUTO) {
        const isMobile: boolean = yield select(getIsAutoLayoutMobileBreakPoint);
        const mainCanvasWidth: number = yield select(getCanvasWidth);
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const metaProps: Record<string, any> = yield select(getWidgetsMeta);

        for (const widgetId of selectedWidgets) {
          finalData = yield call(
            updateFlexLayersOnDelete,
            finalWidgets,
            widgetId,
            parentId,
            isMobile,
            mainCanvasWidth,
            metaProps,
          );
        }
      } else if (isAnvilLayout) {
        for (const widgetId of selectedWidgets) {
          finalData = updateAnvilParentPostWidgetDeletion(
            finalData,
            parentId,
            widgetId,
            widgets[widgetId].type,
          );
        }
      }
    }
    //Main canvas's minheight keeps varying, hence retrieving updated value
    // let mainCanvasMinHeight;
    // if (parentId === MAIN_CONTAINER_WIDGET_ID) {
    //   const mainCanvasProps: MainCanvasReduxState = yield select(
    //     getMainCanvasProps,
    //   );
    //   mainCanvasMinHeight = mainCanvasProps?.height;
    // }

    // if (parentId && widgetsAfterUpdatingFlexLayers[parentId]) {
    //   widgetsAfterUpdatingFlexLayers[
    //     parentId
    //   ].bottomRow = resizePublishedMainCanvasToLowestWidget(
    //     widgetsAfterUpdatingFlexLayers,
    //     parentId,
    //     finalWidgets[parentId].bottomRow,
    //     mainCanvasMinHeight,
    //   );
    // }

    yield call(updateAndSaveAnvilLayout, finalData);
    yield put(generateAutoHeightLayoutTreeAction(true, true));

    yield put(selectWidgetInitAction(SelectionRequestType.Empty));
    const bulkDeleteKey = selectedWidgets.join(",");

    for (const widget of selectedWidgets) {
      yield call(
        FocusRetention.handleRemoveFocusHistory,
        widgetURL({ selectedWidgets: [widget] }),
      );
    }

    if (!disallowUndo) {
      // close property pane after delete
      yield put(closePropertyPane());
      yield put(closeTableFilterPane());
      showUndoRedoToast(`${selectedWidgets.length}`, true, false, true);

      if (bulkDeleteKey) {
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        flattenedWidgets.map((widget: any) => {
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
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.WIDGET_OPERATION_ERROR,
      payload: {
        action: WidgetReduxActionTypes.WIDGET_DELETE,
        error,
        logToDebugger: true,
      },
    });
  }
}

// TODO: Find a way to reuse identical code from anvilDraggingSagas/index.ts
export function handleDeleteRedundantZones(
  allWidgets: CanvasWidgetsReduxState,
  movedWidgets: DraggedWidget[],
) {
  let updatedWidgets: CanvasWidgetsReduxState = { ...allWidgets };
  const parentIds = movedWidgets
    .map((widget) => widget.parentId)
    .filter(Boolean) as string[];

  for (const parentId of parentIds) {
    const zone = updatedWidgets[parentId];

    if (!zone || !isZoneWidget(zone) || !zone.parentId) continue;

    const parentSection = updatedWidgets[zone.parentId];

    if (!parentSection || !isRedundantZoneWidget(zone, parentSection)) continue;

    updatedWidgets = severTiesFromParents(updatedWidgets, [zone.widgetId]);
    delete updatedWidgets[zone.widgetId];

    if (widgetChildren(parentSection).length === 1) {
      updatedWidgets = severTiesFromParents(updatedWidgets, [zone.parentId]);
      delete updatedWidgets[zone.parentId];
    }
  }

  return updatedWidgets;
}

function* postDelete(
  widgetId: string,
  widgetName: string,
  otherWidgetsToDelete: (WidgetProps & {
    children?: string[] | undefined;
  })[],
) {
  showUndoRedoToast(widgetName, false, false, true);

  if (widgetId) {
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
  ]);
}
