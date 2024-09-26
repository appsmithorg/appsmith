import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { GridDefaults } from "constants/WidgetConstants";
import log from "loglevel";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { call, put, select } from "redux-saga/effects";
import { getMinHeightBasedOnChildren, shouldWidgetsCollapse } from "./helpers";
import { getCanvasHeightOffset } from "utils/WidgetSizeUtils";
import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import {
  getWidgetMaxAutoHeight,
  getWidgetMinAutoHeight,
  isAutoHeightEnabledForWidget,
} from "widgets/WidgetUtils";
import { getChildOfContainerLikeWidget } from "./helpers";
import { getDataTree } from "selectors/dataTreeSelectors";
import type { WidgetEntity } from "ee/entities/DataTree/types";
import type { DataTree } from "entities/DataTree/dataTreeTypes";
import { getLayoutTree } from "./layoutTree";
import { getWidgetsForBreakpoint } from "selectors/editorSelectors";

export function* dynamicallyUpdateContainersSaga(
  action?: ReduxAction<{ resettingTabs: boolean }>,
) {
  const start = performance.now();

  const stateWidgets: CanvasWidgetsReduxState = yield select(
    getWidgetsForBreakpoint,
  );
  const canvasWidgets: FlattenedWidgetProps[] | undefined = Object.values(
    stateWidgets,
  ).filter((widget: FlattenedWidgetProps) => {
    const isCanvasWidget = widget.type === "CANVAS_WIDGET";
    const parent = widget.parentId ? stateWidgets[widget.parentId] : undefined;

    if (parent?.type === "LIST_WIDGET") return false;

    if (parent === undefined) return false;

    return isCanvasWidget;
  });

  const { tree: dynamicHeightLayoutTree } = yield getLayoutTree(false);

  const updates: Record<string, number> = {};
  const shouldCollapse: boolean = yield call(shouldWidgetsCollapse);

  for (const canvasWidget of canvasWidgets) {
    if (canvasWidget.parentId) {
      // The parent widget of this canvas widget
      const parentContainerWidget = stateWidgets[canvasWidget.parentId];

      // Skip this whole process if the parent is collapsed: Process:
      // Get the DataTree
      const dataTree: DataTree = yield select(getDataTree);
      // Get this parentContainerWidget from the DataTree
      const dataTreeWidget = dataTree[parentContainerWidget.widgetName];

      // If the widget exists, is not visible and we can collapse widgets
      if (
        dataTreeWidget &&
        (dataTreeWidget as WidgetEntity).isVisible !== true &&
        shouldCollapse
      ) {
        continue;
      }

      if (isAutoHeightEnabledForWidget(parentContainerWidget)) {
        // Get the child we need to consider
        // For a container widget, it will be the child canvas
        // For a tabs widget, it will be the currently open tab's canvas
        const childWidgetId: string | undefined =
          yield getChildOfContainerLikeWidget(parentContainerWidget);

        // This can be different from the canvas widget in consideration
        // For example, if this canvas widget in consideration
        // is not the selected tab's canvas in a tabs widget
        // we don't have to consider it at all
        if (childWidgetId !== canvasWidget.widgetId) {
          continue;
        }

        // Get the boundaries for possible min and max dynamic height.
        const minDynamicHeightInRows = getWidgetMinAutoHeight(
          parentContainerWidget,
        );
        const maxDynamicHeightInRows = getWidgetMaxAutoHeight(
          parentContainerWidget,
        );

        // Default to the min height expected.
        let maxBottomRow = minDynamicHeightInRows;

        // For widgets like Tabs Widget, some of the height is occupied by the
        // tabs themselves, the child canvas as a result has less number of rows available
        // To accommodate for this, we need to increase the new height by the offset amount.
        const canvasHeightOffset: number = getCanvasHeightOffset(
          parentContainerWidget.type,
          parentContainerWidget,
        );

        // If this canvas has children
        // we need to consider the bottom most child for the height
        if (
          Array.isArray(canvasWidget.children) &&
          canvasWidget.children.length > 0
        ) {
          let maxBottomRowBasedOnChildren: number =
            yield getMinHeightBasedOnChildren(
              canvasWidget.widgetId,
              {},
              true,
              dynamicHeightLayoutTree,
            );

          // Add a canvas extension offset
          maxBottomRowBasedOnChildren += GridDefaults.CANVAS_EXTENSION_OFFSET;

          // Add the offset to the total height of the parent widget
          maxBottomRowBasedOnChildren += canvasHeightOffset;

          // Get the larger value between the minDynamicHeightInRows and bottomMostRowForChild
          maxBottomRow = Math.max(maxBottomRowBasedOnChildren, maxBottomRow);
        } else {
          // If the parent is not supposed to be collapsed
          // Use the canvasHeight offset, as that would be the
          // minimum
          if (
            parentContainerWidget.bottomRow - parentContainerWidget.topRow >
              0 ||
            !shouldCollapse
          ) {
            maxBottomRow += canvasHeightOffset;
          }
        }

        // The following makes sure we stay within bounds
        // If the new height is below the min threshold
        if (maxBottomRow < minDynamicHeightInRows) {
          maxBottomRow = minDynamicHeightInRows;
        }

        // If the new height is above the max threshold
        if (maxBottomRow > maxDynamicHeightInRows) {
          maxBottomRow = maxDynamicHeightInRows;
        }

        if (
          action?.payload.resettingTabs &&
          parentContainerWidget.type === "TABS_WIDGET"
        ) {
          const layoutNode =
            dynamicHeightLayoutTree[parentContainerWidget.widgetId];

          if (
            layoutNode &&
            maxBottomRow === layoutNode.bottomRow - layoutNode.topRow
          ) {
            continue;
          }
        }

        // If we have a new height to set and
        if (!updates.hasOwnProperty(parentContainerWidget.widgetId)) {
          updates[parentContainerWidget.widgetId] =
            maxBottomRow * GridDefaults.DEFAULT_GRID_ROW_HEIGHT;
        }
      }
    }
  }

  log.debug("Auto Height: Container Updates", { updates });

  if (Object.keys(updates).length > 0) {
    // TODO(abhinav): Make sure there are no race conditions or scenarios where these updates are not considered.
    for (const widgetId in updates) {
      yield put({
        type: ReduxActionTypes.UPDATE_WIDGET_AUTO_HEIGHT,
        payload: {
          widgetId,
          height: updates[widgetId],
        },
      });
    }
  }

  log.debug(
    "Auto height: Container computations time taken:",
    performance.now() - start,
    "ms",
  );
}
