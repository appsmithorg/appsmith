import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { GridDefaults } from "constants/WidgetConstants";
import { groupBy } from "lodash";
import log from "loglevel";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { put, select } from "redux-saga/effects";
import { getWidgetMetaProps, getWidgets } from "sagas/selectors";
import { getCanvasHeightOffset } from "selectors/editorSelectors";
import { TreeNode } from "utils/autoHeight/constants";
import { FlattenedWidgetProps } from "widgets/constants";
import {
  getWidgetMaxAutoHeight,
  getWidgetMinAutoHeight,
  isAutoHeightEnabledForWidget,
} from "widgets/WidgetUtils";

export function* getChildOfContainerLikeWidget(
  containerLikeWidget: FlattenedWidgetProps,
) {
  // Todo: Abstraction leak (abhinav): This is an abstraction leak
  // I don't have a better solution right now.
  // What we're trying to acheive is to skip the canvas which
  // is not currently visible in the tabs widget.
  if (containerLikeWidget.type === "TABS_WIDGET") {
    // Get the current tabs widget meta
    const tabsMeta: { selectedTabWidgetId: string } | undefined = yield select(
      getWidgetMetaProps,
      containerLikeWidget.widgetId,
    );
    // If we have a meta for the tabs widget
    if (tabsMeta) return tabsMeta.selectedTabWidgetId;

    // If there are not meta values for the tabs widget
    // we get the first tab using the `index`
    const firstTab = Object.values(
      containerLikeWidget.tabsObj as Record<
        string,
        { widgetId: string; index: number }
      >,
    ).find((entry: { widgetId: string; index: number }) => entry.index === 0);

    return firstTab?.widgetId;
  } else if (Array.isArray(containerLikeWidget.children)) {
    // First child of a container like widget will be the canvas widget within in
    // Note: If we have this feature for List Widget, we will need to consider it.
    return containerLikeWidget.children[0];
  }
}

export function* dynamicallyUpdateContainersSaga() {
  const start = performance.now();

  const stateWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
  // Filter all widgets to get only the CANVAS_WIDGET
  const canvasWidgets: FlattenedWidgetProps[] | undefined = Object.values(
    stateWidgets,
  ).filter((widget: FlattenedWidgetProps) => widget.type === "CANVAS_WIDGET");

  // TODO (abhinav): Implement this when the relevant code PR is merged.
  const canvasLevelMap: Record<string, number> = { "0": 0 };
  const autoHeightLayoutTree: Record<string, TreeNode> = {};

  // Group canvas widgets by level
  const groupedByCanvasLevel = groupBy(
    canvasWidgets,
    (widget) => canvasLevelMap[widget.widgetId],
  );

  // Get all the levels in which we have canvas widgets
  // Then sort them such that we have levels starting at the max level
  const levels = Object.keys(groupedByCanvasLevel)
    .map((level) => parseInt(level, 10))
    .sort((a, b) => b - a);

  const updates: Record<string, number> = {};

  // For each of the levels
  for (const level of levels) {
    // The canvas widgets at this level
    const canvasWidgetsAtThisLevel = groupedByCanvasLevel[`${level}`];
    // For each of the canvas widgets
    for (const canvasWidget of canvasWidgetsAtThisLevel) {
      // If canvas widget has parentId (this means that this canvas widget is not the MainContainer)
      if (canvasWidget.parentId) {
        // Get the parent of this canvas widget.
        const parentContainerWidget = stateWidgets[canvasWidget.parentId];

        let bottomRow, topRow;
        // If this treeNode exists in the layoutTree
        if (autoHeightLayoutTree[parentContainerWidget.widgetId]) {
          // Get the TreeNode
          const layoutNode =
            autoHeightLayoutTree[parentContainerWidget.widgetId];
          bottomRow = layoutNode.bottomRow;
          topRow = layoutNode.topRow;
        } else {
          // If the node doesn't exist in the layoutTree
          // TODO(abhinav): This should ideally never happen
          // But, can happen for modal widget?
          bottomRow = parentContainerWidget.bottomRow;
          topRow = parentContainerWidget.topRow;
        }
        // If this container like widget has auto height enabled
        if (isAutoHeightEnabledForWidget(parentContainerWidget)) {
          // Get Child of this container like widget
          // If this is a Tabs Widget, it will be the currently selected tab canvas widget Id
          const childWidgetId:
            | string
            | undefined = yield getChildOfContainerLikeWidget(
            parentContainerWidget,
          );
          // If the current canvas widget isn't the one we're looking into
          // This can happen when the childWidgetId is not the selected Tabs Widget
          // Continue, as we don't need to check or change the Tabs widget height
          if (childWidgetId !== canvasWidget.widgetId) continue;

          let maxBottomRow = bottomRow - topRow;
          // If this container like widget is a Modal Widget
          if (
            parentContainerWidget.detachFromLayout &&
            parentContainerWidget.height
          ) {
            maxBottomRow =
              parentContainerWidget.height /
              GridDefaults.DEFAULT_GRID_ROW_HEIGHT;
          }

          // If this canvas widget has children
          if (
            Array.isArray(canvasWidget.children) &&
            canvasWidget.children.length > 0
          ) {
            // Get the max bottom row of the bottom most widget in the canvas widget
            maxBottomRow = canvasWidget.children.reduce(
              (prev: number, next: string) => {
                if (autoHeightLayoutTree[next].bottomRow > prev)
                  return autoHeightLayoutTree[next].bottomRow;
                return prev;
              },
              0,
            );
            // add the canvas extension offset
            maxBottomRow += GridDefaults.CANVAS_EXTENSION_OFFSET;

            // For widgets like Tabs Widget, some of the height is occupied by the
            // tabs themselves, the child canvas as a result has less number of rows available
            // To accommodate for this, we need to increase the new height by the offset amount.
            const canvasHeightOffset: number = getCanvasHeightOffset(
              parentContainerWidget.type,
              parentContainerWidget,
            );

            maxBottomRow += canvasHeightOffset;
          }
          // Get the boundaries for possible min and max auto height.
          const minAutoHeightInRows = getWidgetMinAutoHeight(
            parentContainerWidget,
          );
          const maxAutoHeightInRows = getWidgetMaxAutoHeight(
            parentContainerWidget,
          );

          // If the new height is below the min threshold
          if (maxBottomRow < minAutoHeightInRows) {
            maxBottomRow = minAutoHeightInRows;
          }
          // If the new height is above the max threshold
          if (maxBottomRow > maxAutoHeightInRows) {
            maxBottomRow = maxAutoHeightInRows;
          }

          // If the newly computed maxBottomRow is different from the original number of rows
          if (maxBottomRow !== bottomRow - topRow) {
            // If we don't already have this in the updates
            // TODO(abhinav): Don't know why we would have this in the updates.
            if (!updates.hasOwnProperty(parentContainerWidget.widgetId)) {
              updates[parentContainerWidget.widgetId] =
                maxBottomRow * GridDefaults.DEFAULT_GRID_ROW_HEIGHT;
            }
          }
        }
      }
    }
  }

  // For each of the updates call the update action
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
    "Auto height: Container computations took:",
    performance.now() - start,
    "ms",
  );
}
