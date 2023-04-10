import type {
  MultipleWidgetDeletePayload,
  WidgetDelete,
} from "actions/pageActions";
import { updateAndSaveLayout } from "actions/pageActions";
import { closePropertyPane, closeTableFilterPane } from "actions/widgetActions";
import { selectWidgetInitAction } from "actions/widgetSelectionActions";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
  WidgetReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { ENTITY_TYPE } from "entities/AppsmithConsole";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import { flattenDeep, omit, orderBy } from "lodash";
import type {
  CanvasWidgetsReduxState,
  FlattenedWidgetProps,
} from "reducers/entityReducers/canvasWidgetsReducer";
import { all, call, put, select, takeEvery } from "redux-saga/effects";
import {
  getCanvasWidth,
  getIsAutoLayoutMobileBreakPoint,
} from "selectors/editorSelectors";
import { getSelectedWidgets } from "selectors/ui";
import AnalyticsUtil from "utils/AnalyticsUtil";
import AppsmithConsole from "utils/AppsmithConsole";
import type { WidgetProps } from "widgets/BaseWidget";
import { getSelectedWidget, getWidget, getWidgets } from "./selectors";
import type { WidgetsInTree } from "./WidgetOperationUtils";
import {
  getAllWidgetsInTree,
  updateListWidgetPropertiesOnChildDelete,
} from "./WidgetOperationUtils";
import { showUndoRedoToast } from "utils/replayHelpers";
import WidgetFactory from "utils/WidgetFactory";
import {
  inGuidedTour,
  isExploringSelector,
} from "selectors/onboardingSelectors";
import { toggleShowDeviationDialog } from "actions/onboardingActions";
import { generateAutoHeightLayoutTreeAction } from "actions/autoHeightActions";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import { updateFlexLayersOnDelete } from "../utils/autoLayout/AutoLayoutUtils";

const WidgetTypes = WidgetFactory.widgetTypes;

type WidgetDeleteTabChild = {
  id: string;
  index: number;
  isVisible: boolean;
  label: string;
  widgetId: string;
};

function* deleteTabChildSaga(
  deleteChildTabAction: ReduxAction<WidgetDeleteTabChild>,
) {
  const { index, label, widgetId } = deleteChildTabAction.payload;
  const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
  const tabWidget = allWidgets[widgetId];
  if (tabWidget && tabWidget.parentId) {
    const tabParentWidget = allWidgets[tabWidget.parentId];
    const tabsArray: any = orderBy(
      Object.values(tabParentWidget.tabsObj),
      "index",
      "asc",
    );
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
      // Update flex layers of a canvas upon deletion of a widget.
      const isMobile: boolean = yield select(getIsAutoLayoutMobileBreakPoint);
      const mainCanvasWidth: number = yield select(getCanvasWidth);
      const widgetsAfterUpdatingFlexLayers: CanvasWidgetsReduxState =
        yield call(
          updateFlexLayersOnDelete,
          parentUpdatedWidgets,
          widgetId,
          tabWidget.parentId,
          isMobile,
          mainCanvasWidth,
        );
      yield put(updateAndSaveLayout(widgetsAfterUpdatingFlexLayers));
      yield call(postDelete, widgetId, label, otherWidgetsToDelete);
    }
  }
}

function* deleteSagaInit(deleteAction: ReduxAction<WidgetDelete>) {
  const { widgetId } = deleteAction.payload;
  const selectedWidget: FlattenedWidgetProps | undefined = yield select(
    getSelectedWidget,
  );
  const selectedWidgets: string[] = yield select(getSelectedWidgets);
  const guidedTourEnabled: boolean = yield select(inGuidedTour);
  const isExploring: boolean = yield select(isExploringSelector);

  if (guidedTourEnabled && !isExploring) {
    yield put(toggleShowDeviationDialog(true));
    return;
  }

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

function* deleteSaga(deleteAction: ReduxAction<WidgetDelete>) {
  try {
    let { parentId, widgetId } = deleteAction.payload;

    const { disallowUndo, isShortcut } = deleteAction.payload;

    if (!widgetId) {
      const selectedWidget: FlattenedWidgetProps | undefined = yield select(
        getSelectedWidget,
      );
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

      if (updatedObj) {
        const { finalWidgets, otherWidgetsToDelete, widgetName } = updatedObj;
        const isMobile: boolean = yield select(getIsAutoLayoutMobileBreakPoint);
        const mainCanvasWidth: number = yield select(getCanvasWidth);
        // Update flex layers of a canvas upon deletion of a widget.
        const widgetsAfterUpdatingFlexLayers: CanvasWidgetsReduxState =
          updateFlexLayersOnDelete(
            finalWidgets,
            widgetId,
            parentId,
            isMobile,
            mainCanvasWidth,
          );
        yield put(updateAndSaveLayout(widgetsAfterUpdatingFlexLayers));
        yield put(generateAutoHeightLayoutTreeAction(true, true));
        const analyticsEvent = isShortcut
          ? "WIDGET_DELETE_VIA_SHORTCUT"
          : "WIDGET_DELETE";

        AnalyticsUtil.logEvent(analyticsEvent, {
          widgetName: widget.widgetName,
          widgetType: widget.type,
        });
        if (!disallowUndo) {
          // close property pane after delete
          yield put(closePropertyPane());
          yield put(
            selectWidgetInitAction(SelectionRequestType.Unselect, [widgetId]),
          );
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
      flattenedWidgets.map((widgets: any) => widgets.widgetId),
    );
    // assuming only widgets with same parent can be selected
    const parentId = widgets[selectedWidgets[0]].parentId;
    let widgetsAfterUpdatingFlexLayers: CanvasWidgetsReduxState = finalWidgets;
    if (parentId) {
      const isMobile: boolean = yield select(getIsAutoLayoutMobileBreakPoint);
      const mainCanvasWidth: number = yield select(getCanvasWidth);
      for (const widgetId of selectedWidgets) {
        widgetsAfterUpdatingFlexLayers = yield call(
          updateFlexLayersOnDelete,
          widgetsAfterUpdatingFlexLayers,
          widgetId,
          parentId,
          isMobile,
          mainCanvasWidth,
        );
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

    yield put(updateAndSaveLayout(widgetsAfterUpdatingFlexLayers));
    yield put(generateAutoHeightLayoutTreeAction(true, true));

    yield put(selectWidgetInitAction(SelectionRequestType.Empty));
    const bulkDeleteKey = selectedWidgets.join(",");
    if (!disallowUndo) {
      // close property pane after delete
      yield put(closePropertyPane());
      yield put(closeTableFilterPane());
      showUndoRedoToast(`${selectedWidgets.length}`, true, false, true);
      if (bulkDeleteKey) {
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
      },
    });
  }
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
