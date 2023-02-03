import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { GridDefaults } from "constants/WidgetConstants";
import log from "loglevel";
import { AutoHeightLayoutTreeReduxState } from "reducers/entityReducers/autoHeightReducers/autoHeightLayoutTreeReducer";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { call, put, select } from "redux-saga/effects";
import { getMinHeightBasedOnChildren, shouldWidgetsCollapse } from "./helpers";
import { getWidgets } from "sagas/selectors";
import { getCanvasHeightOffset } from "selectors/editorSelectors";
import { getAutoHeightLayoutTree } from "selectors/autoHeightSelectors";
import { FlattenedWidgetProps } from "widgets/constants";
import {
  getWidgetMaxAutoHeight,
  getWidgetMinAutoHeight,
  isAutoHeightEnabledForWidget,
} from "widgets/WidgetUtils";
import { getChildOfContainerLikeWidget } from "./helpers";
import { getDataTree } from "selectors/dataTreeSelectors";
import { DataTree, DataTreeWidget } from "entities/DataTree/dataTreeFactory";

export function* dynamicallyUpdateContainersSaga() {
  const start = performance.now();

  const stateWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
  const canvasWidgets: FlattenedWidgetProps[] | undefined = Object.values(
    stateWidgets,
  ).filter((widget: FlattenedWidgetProps) => {
    const isCanvasWidget = widget.type === "CANVAS_WIDGET";
    const parent = widget.parentId ? stateWidgets[widget.parentId] : undefined;
    if (parent?.type === "LIST_WIDGET") return false;
    if (parent === undefined) return false;
    return isCanvasWidget;
  });

  const dynamicHeightLayoutTree: AutoHeightLayoutTreeReduxState = yield select(
    getAutoHeightLayoutTree,
  );

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
        (dataTreeWidget as DataTreeWidget).isVisible !== true &&
        shouldCollapse
      )
        continue;

      let bottomRow, topRow;
      // If the parent exists in the layout tree
      if (dynamicHeightLayoutTree[parentContainerWidget.widgetId]) {
        // Get the tree node for the parent
        const layoutNode =
          dynamicHeightLayoutTree[parentContainerWidget.widgetId];
        // Get all the dimensions from the tree node
        bottomRow = layoutNode.bottomRow;
        topRow = layoutNode.topRow;
      } else {
        // If it doesn't exist in the layout tree
        // It is most likely a Modal Widget
        // Use the dimensions as they exist in the widget.
        bottomRow = parentContainerWidget.bottomRow;
        topRow = parentContainerWidget.topRow;
      }

      // If this is a Modal widget or some other widget
      // which is detached from layout
      // use the value 0, as the starting point.
      if (
        parentContainerWidget.detachFromLayout &&
        parentContainerWidget.height
      ) {
        topRow = 0;
      }

      if (isAutoHeightEnabledForWidget(parentContainerWidget)) {
        // Get the child we need to consider
        // For a container widget, it will be the child canvas
        // For a tabs widget, it will be the currently open tab's canvas
        const childWidgetId:
          | string
          | undefined = yield getChildOfContainerLikeWidget(
          parentContainerWidget,
        );

        // This can be different from the canvas widget in consideration
        // For example, if this canvas widget in consideration
        // is not the selected tab's canvas in a tabs widget
        // we don't have to consider it at all
        if (childWidgetId !== canvasWidget.widgetId) continue;

        // Get the boundaries for possible min and max dynamic height.
        const minDynamicHeightInRows = getWidgetMinAutoHeight(
          parentContainerWidget,
        );
        const maxDynamicHeightInRows = getWidgetMaxAutoHeight(
          parentContainerWidget,
        );

        // Default to the min height expected.
        let maxBottomRow = minDynamicHeightInRows;

        // For the child Canvas, use the value in pixels.
        let canvasBottomRow = maxBottomRow + 0;

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
          let maxBottomRowBasedOnChildren: number = yield getMinHeightBasedOnChildren(
            canvasWidget.widgetId,
            {},
            true,
            dynamicHeightLayoutTree,
          );
          // Add a canvas extension offset
          maxBottomRowBasedOnChildren += GridDefaults.CANVAS_EXTENSION_OFFSET;
          // Set the canvas bottom row as a new variable with a new reference
          canvasBottomRow = maxBottomRowBasedOnChildren + 0;

          // Add the offset to the total height of the parent widget
          maxBottomRowBasedOnChildren += canvasHeightOffset;

          // Get the larger value between the minDynamicHeightInRows and bottomMostRowForChild
          maxBottomRow = Math.max(maxBottomRowBasedOnChildren, maxBottomRow);
        } else {
          canvasBottomRow = maxBottomRow - canvasHeightOffset;
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

        canvasBottomRow =
          Math.max(maxBottomRow - canvasHeightOffset, canvasBottomRow) *
          GridDefaults.DEFAULT_GRID_ROW_HEIGHT;

        // If we have a new height to set and
        // If the canvas for some reason doesn't have the correct bottomRow
        if (
          maxBottomRow !== bottomRow - topRow ||
          canvasBottomRow !== canvasWidget.bottomRow
        ) {
          if (!updates.hasOwnProperty(parentContainerWidget.widgetId)) {
            updates[parentContainerWidget.widgetId] =
              maxBottomRow * GridDefaults.DEFAULT_GRID_ROW_HEIGHT;
          }
        }
      }
    }
  }

  log.debug("Dynamic Height: Container Updates", { updates });

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
    "Dynamic height: Container computations time taken:",
    performance.now() - start,
    "ms",
  );
}
