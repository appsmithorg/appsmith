import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
  WidgetReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import type {
  CanvasWidgetsReduxState,
  FlattenedWidgetProps,
} from "reducers/entityReducers/canvasWidgetsReducer";
import { all, call, put, select, takeEvery } from "redux-saga/effects";
import type { WidgetProps } from "widgets/BaseWidget";
import { getWidget, getWidgets } from "./selectors";
import {
  WIDGET_ARCHIVE,
  WIDGET_UNARCHIVE,
  ERROR_WIDGET_ARCHIVE_NOT_ALLOWED,
  createMessage,
} from "@appsmith/constants/messages";
import { toast } from "design-system";
import { updateAndSaveAnvilLayout } from "layoutSystems/anvil/utils/anvilChecksUtils";
import { getAllWidgetsInTree } from "./WidgetOperationUtils";
import type { WidgetsInTree } from "./WidgetOperationUtils";
import { generateAutoHeightLayoutTreeAction } from "actions/autoHeightActions";

interface ArchiveActionPayload {
  parentId: string;
  widgetId: string;
}

type UpdatedDSLPostArchive =
  | {
      finalWidgets: CanvasWidgetsReduxState;
      widgetName: string;
    }
  | undefined;

function* getUpdatedDsl(
  widgetId: string,
  parentId: string,
  isArchiving: boolean,
): Generator<any, UpdatedDSLPostArchive, any> {
  const stateWidgets: CanvasWidgetsReduxState = yield select(getWidgets);

  if (widgetId && parentId) {
    const widgets = { ...stateWidgets };
    const stateWidget: WidgetProps = yield select(getWidget, widgetId);
    const widget = { ...stateWidget };

    const stateParent: FlattenedWidgetProps = yield select(getWidget, parentId);
    const parent = { ...stateParent };

    if (!widget || !parent) {
      console.error("Widget or Parent not found");
      return;
    }

    const updatedChildren = isArchiving
      ? parent.children // Children will be updated later using the WIDGET_DELETE action
      : [...(parent.children || []), widgetId];

    const updatedArchived = isArchiving
      ? [...(parent.archived || []), widgetId]
      : parent.archived?.filter((id) => id !== widgetId) || [];

    const updatedParent = {
      ...parent,
      children: updatedChildren,
      archived: updatedArchived,
    };

    const updatedWidget = {
      ...widget,
      isArchived: isArchiving,
    };

    widgets[parentId] = updatedParent;
    widgets[widgetId] = updatedWidget;

    var finalWidgets = widgets;

    const otherWidgetsToArchive = getAllWidgetsInTree(widgetId, widgets);

    // Call the auxiliary function to process other widgets for archiving
    finalWidgets = yield call(
      processWidgetArchival,
      widgetId,
      isArchiving,
      widgets,
      otherWidgetsToArchive,
    );

    return {
      finalWidgets: finalWidgets,
      widgetName: widget.widgetName,
    } as UpdatedDSLPostArchive;
  }
}

function* archiveWidgetSaga(action: ReduxAction<ArchiveActionPayload>) {
  try {
    const { parentId, widgetId } = action.payload;
    const widget: FlattenedWidgetProps | undefined = yield select(
      getWidget,
      widgetId,
    );

    if (!widget) {
      console.error("Widget not found:", widgetId);
      return;
    }

    if (widget.isDeletable === false) {
      toast.show(
        createMessage(ERROR_WIDGET_ARCHIVE_NOT_ALLOWED, widget.widgetName),
        {
          kind: "info",
        },
      );
      return;
    }

    const updatedObj: UpdatedDSLPostArchive = yield call(
      getUpdatedDsl,
      widgetId,
      parentId,
      true, // isArchiving
    );

    if (updatedObj) {
      const finalData: CanvasWidgetsReduxState = updatedObj.finalWidgets;
      yield call(updateAndSaveAnvilLayout, finalData);

      toast.show(createMessage(WIDGET_ARCHIVE, updatedObj.widgetName), {
        kind: "success",
      });

      yield put({
        type: WidgetReduxActionTypes.WIDGET_DELETE,
        payload: {
          widgetId,
          parentId,
          archived: false,
        },
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.WIDGET_OPERATION_ERROR,
      payload: {
        action: WidgetReduxActionTypes.WIDGET_ARCHIVE,
        error,
      },
    });
  }
}

function* unarchiveWidgetSaga(action: ReduxAction<ArchiveActionPayload>) {
  try {
    const { parentId, widgetId } = action.payload;
    const widget: FlattenedWidgetProps | undefined = yield select(
      getWidget,
      widgetId,
    );

    if (!widget) {
      console.error("Widget not found:", widgetId);
      return;
    }

    const updatedObj: UpdatedDSLPostArchive = yield call(
      getUpdatedDsl,
      widgetId,
      parentId,
      false, // isArchiving
    );

    if (updatedObj) {
      const finalData: CanvasWidgetsReduxState = updatedObj.finalWidgets;
      yield call(updateAndSaveAnvilLayout, finalData);
      yield put(generateAutoHeightLayoutTreeAction(true, true));

      toast.show(createMessage(WIDGET_UNARCHIVE, updatedObj.widgetName), {
        kind: "success",
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.WIDGET_OPERATION_ERROR,
      payload: {
        action: WidgetReduxActionTypes.WIDGET_UNARCHIVE,
        error,
      },
    });
  }
}

/**
 * Processes widgets to archive them and moves archived widgets to children if necessary.
 * @param {string} mainWidgetId - ID of the widget initiating the archive/unarchive process.
 * @param {boolean} isArchiving - Whether the widgets are being archived.
 * @param {CanvasWidgetsReduxState} widgets - Current state of all widgets.
 * @param {WidgetsInTree} otherWidgets - Widgets to process apart from the main widget.
 * @returns {CanvasWidgetsReduxState} Updated widgets state.
 */
function* processWidgetArchival(
  mainWidgetId: string,
  isArchiving: boolean,
  widgets: CanvasWidgetsReduxState,
  otherWidgets: WidgetsInTree,
): Generator<any, CanvasWidgetsReduxState, any> {
  const updatedWidgets = { ...widgets };

  otherWidgets.forEach((widget) => {
    if (widget.widgetId !== mainWidgetId) {
      // Avoid re-archiving the initial widget
      let childUpdates = {
        ...widget,
        isArchived: isArchiving,
      };

      if (isArchiving) {
        // If a widget has an archived child, move them to children. This way all archived widgets are in one place.
        if (childUpdates.archived && childUpdates.archived.length > 0) {
          childUpdates.children = [
            ...(childUpdates.children || []),
            ...childUpdates.archived,
          ];
          childUpdates.archived = [];
        }
      }

      updatedWidgets[widget.widgetId] = childUpdates;
    }
  });

  return updatedWidgets;
}

export default function* widgetArchiveSagas() {
  yield all([
    takeEvery(ReduxActionTypes.ARCHIVE_WIDGET, archiveWidgetSaga),
    takeEvery(ReduxActionTypes.UNARCHIVE_WIDGET, unarchiveWidgetSaga),
  ]);
}
