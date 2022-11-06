import { CANVAS_DEFAULT_MIN_HEIGHT_PX } from "constants/AppConstants";
import {
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import { groupBy, uniq } from "lodash";
import log from "loglevel";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { put, select } from "redux-saga/effects";
import { getWidgets } from "sagas/selectors";
import { getCanvasHeightOffset } from "selectors/editorSelectors";
import { TreeNode } from "utils/autoHeight/constants";
import { FlattenedWidgetProps } from "widgets/constants";
import {
  getWidgetMaxAutoHeight,
  getWidgetMinAutoHeight,
  isAutoHeightEnabledForWidget,
} from "widgets/WidgetUtils";
import {
  getAutoHeightUpdateQueue,
  resetAutoHeightUpdateQueue,
} from "./batcher";
import {
  getChildOfContainerLikeWidget,
  getMinHeightBasedOnChildren,
  shouldWidgetsCollapse,
} from "./helpers";

/**
 * Saga to update a widget's auto height
 * When a widget changes in height, it must do the following
 * - Make sure any parent that should also change height accordingly, does so
 * - Make sure any widget that needs to reposition due to the above changes, does so
 *
 *
 * TODO: PERF_TRACK(abhinav): Make sure to benchmark the computations.
 * We need to propagate changes within 10ms
 */
export function* updateWidgetAutoHeightSaga() {
  const updates = getAutoHeightUpdateQueue();
  const start = performance.now();

  log.debug(
    "Dynamic height: Computing debounced: ",
    { updates },
    { timeStamp: performance.now() },
  );

  // Get all widgets from canvasWidgetsReducer
  const stateWidgets: CanvasWidgetsReduxState = yield select(getWidgets);

  // Initialise all the widgets we will be updating
  const widgetsToUpdate: Record<
    string,
    Array<{ propertyPath: string; propertyValue: unknown }>
  > = {};

  // Initialise all expected updates
  const expectedUpdates: Array<{
    widgetId: string;
    expectedHeightinPx: number;
    expectedChangeInHeightInRows: number;
    currentTopRow: number;
    currentBottomRow: number;
    expectedBottomRow: number;
    parentId?: string;
    hasScroll?: boolean;
  }> = [];

  const shouldCollapse: boolean = yield shouldWidgetsCollapse();

  // For each widget which have new heights to update.
  for (const widgetId in updates) {
    // Get the widget from the reducer.
    const widget: FlattenedWidgetProps = stateWidgets[widgetId];
    // If this widget exists (not sure why this needs to be here)
    if (widget && !widget.detachFromLayout) {
      // Get the boundaries for possible min and max dynamic height.
      let minDynamicHeightInPixels =
        getWidgetMinAutoHeight(widget) * GridDefaults.DEFAULT_GRID_ROW_HEIGHT;

      // In case of a widget going invisible in view mode
      if (updates[widgetId] === 0) {
        if (shouldCollapse && isAutoHeightEnabledForWidget(widget)) {
          minDynamicHeightInPixels = 0;
        } else continue;
      }

      const maxAutoHeightInPixels =
        getWidgetMaxAutoHeight(widget) * GridDefaults.DEFAULT_GRID_ROW_HEIGHT;
      let newHeightInPixels = updates[widgetId];

      // If the new height is below the min threshold
      if (newHeightInPixels < minDynamicHeightInPixels) {
        newHeightInPixels = minDynamicHeightInPixels;
      }
      // If the new height is above the max threshold
      if (newHeightInPixels > maxAutoHeightInPixels) {
        newHeightInPixels = maxAutoHeightInPixels;
      }

      const expectedHeightInRows = Math.ceil(
        newHeightInPixels / GridDefaults.DEFAULT_GRID_ROW_HEIGHT -
          (widget.bottomRow - widget.topRow),
      );

      // Push the updates into the initialised array.
      expectedUpdates.push({
        widgetId,
        expectedHeightinPx: newHeightInPixels,
        expectedChangeInHeightInRows: expectedHeightInRows,
        currentTopRow: widget.topRow,
        currentBottomRow: widget.bottomRow,
        expectedBottomRow: Math.ceil(
          widget.topRow +
            newHeightInPixels / GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
        ),
        parentId: widget.parentId,
        hasScroll: widget.isCanvas ? true : false,
      });
    } else if (widget) {
      // For widgets like Modal Widget. (Rather this assumes that it is only the modal widget which needs a change)
      const newHeight = updates[widgetId];
      const newHeightInRows = newHeight / GridDefaults.DEFAULT_GRID_ROW_HEIGHT;

      widgetsToUpdate[widgetId] = [
        {
          propertyPath: "height",
          propertyValue: newHeight,
        },
        {
          propertyPath: "bottomRow",
          propertyValue: widget.topRow + newHeightInRows,
        },
        {
          propertyPath: "topRow",
          propertyValue: widget.topRow,
        },
      ];
    }
  }

  // If there are updates.
  if (expectedUpdates.length > 0) {
    // TODO (abhinav): Implement this when the relevant code PR is merged.

    // Get the tree data structure we will be using to compute updates
    const autoHeightLayoutTree: Record<string, TreeNode> = {};
    // Get the canvas level map from the store
    // This map tells us the nesting of each canvas widget in the DSL.
    // MainContainer's level is 0.
    const canvasLevelMap: Record<string, number> = { "0": 0 };

    // 1. Get all siblings together.

    // Get all updates for that level.
    // Move up a level, add it to the expectedUpdatesGroupedByParent. A new entry if unavailable, or append to an existing entry,
    // Repeat for the next level.
    const expectedUpdatesGroupedByParentCanvasWidget = groupBy(
      expectedUpdates,
      "parentId",
    );

    // Initialise a map of the levels and canvaswidgetIds at that level.
    const parentCanvasWidgetsGroupedByLevel: { [level: string]: string[] } = {
      "0": [MAIN_CONTAINER_WIDGET_ID],
    };

    let maxLevel = 0;

    // For each canvas widget which has updates.
    for (const parentCanvasWidgetId in expectedUpdatesGroupedByParentCanvasWidget) {
      // Get the level of the canvas widget
      const _level = canvasLevelMap[parentCanvasWidgetId];

      // If the level is higher than the previous level, increment maxLevel
      if (_level > maxLevel) maxLevel = _level;

      // update the map with the canvas widgets in the current level.
      parentCanvasWidgetsGroupedByLevel[_level] = uniq([
        ...(parentCanvasWidgetsGroupedByLevel[_level] || []),
        parentCanvasWidgetId,
      ]);
    }

    // Initialise a list of changes so far.
    // This contains a map of widgetIds with their new topRow and bottomRow
    let changesSoFar: Record<
      string,
      { topRow: number; bottomRow: number }
    > = {};

    // start with the bottom most level (maxLevel)
    // We do this so, that we don't have to re-comupte the higher levels,
    // as children can modify their parent sizes.
    for (let level = maxLevel; level >= 0; level--) {
      // The canvas widgets at this level.
      const parentCanvasWidgetsToConsider =
        parentCanvasWidgetsGroupedByLevel[level];
      const delta: Record<string, number> = {};

      if (
        Array.isArray(parentCanvasWidgetsToConsider) &&
        parentCanvasWidgetsToConsider.length > 0
      ) {
        // For each canvas widget at this level.
        parentCanvasWidgetsToConsider.forEach((parentCanvasWidgetId) => {
          // If we have expected updates for this widget already
          if (
            expectedUpdatesGroupedByParentCanvasWidget.hasOwnProperty(
              parentCanvasWidgetId,
            )
          ) {
            // For each widget to update, add to the delta, the expected change.
            expectedUpdatesGroupedByParentCanvasWidget[
              parentCanvasWidgetId
            ].forEach((update) => {
              delta[
                (update as {
                  widgetId: string;
                  expectedChangeInHeightInRows: number;
                }).widgetId
              ] = (update as {
                widgetId: string;
                expectedChangeInHeightInRows: number;
              }).expectedChangeInHeightInRows;
            });
          }
        });
      }

      if (Object.keys(delta).length > 0) {
        // 2. Run the reflow computations for  this parent's child updates
        const siblingWidgetsToUpdate = computeChangeInPositionBasedOnDelta(
          autoHeightLayoutTree,
          delta,
        );

        // Add to the changes so far, the changes computed for this canvas widget's children.
        changesSoFar = Object.assign(changesSoFar, siblingWidgetsToUpdate);

        log.debug("Dynamic height: Computing sibling updates:", {
          siblingWidgetsToUpdate,
          autoHeightLayoutTree,
          delta,
          parentCanvasWidgetsToConsider,
          changesSoFar,
          expectedUpdatesGroupedByParentCanvasWidget,
          expectedUpdates,
        });

        // Repeat the previous loop, we need to do this, because we need the changesSoFar
        // populated before we can reliably work on the parents
        for (const parentCanvasWidgetId of parentCanvasWidgetsToConsider) {
          // Get the current canvas Widget props
          const parentCanvasWidget: FlattenedWidgetProps =
            stateWidgets[parentCanvasWidgetId];
          // If this canvas widget has a parent then it is not the MainContainer
          if (parentCanvasWidget.parentId) {
            // Get the parent widget. This could be Tabs, Modal, Container, Form, etc.
            // As these widgets have canvas children.
            const parentContainerLikeWidget: FlattenedWidgetProps =
              stateWidgets[parentCanvasWidget.parentId];

            // Widgets need to consider changing heights, only if they have dynamic height
            // enabled.
            if (isAutoHeightEnabledForWidget(parentContainerLikeWidget)) {
              // Get the minimum number of rows this parent must have

              let minHeightInRows = getWidgetMinAutoHeight(
                parentContainerLikeWidget,
              );

              // Get the array of children ids.
              // This cannot be [], because we came to this point due to an update
              // caused by one of the children.
              // const children = parentCanvasWidget.children || []; // It's never going to be []

              const minPossibleHeight: number = yield getMinHeightBasedOnChildren(
                parentCanvasWidget.widgetId,
                changesSoFar,
              );

              minHeightInRows = Math.max(minPossibleHeight, minHeightInRows);

              // Add extra rows, this is to accommodate for padding and margins in the parent
              minHeightInRows =
                minHeightInRows + GridDefaults.CANVAS_EXTENSION_OFFSET;

              // Setting this in a variable, as this will be the total scroll height in the canvas.
              const maxBottomRow = minHeightInRows + 0;

              // For widgets like Tabs Widget, some of the height is occupied by the
              // tabs themselves, the child canvas as a result has less number of rows available
              // To accommodate for this, we need to increase the new height by the offset amount.
              const canvasHeightOffset: number = getCanvasHeightOffset(
                parentContainerLikeWidget.type,
                parentContainerLikeWidget,
              );
              minHeightInRows += canvasHeightOffset;

              // Make sure we're not overflowing the max height bounds
              const maxAutoHeight = getWidgetMaxAutoHeight(
                parentContainerLikeWidget,
              );

              minHeightInRows = Math.min(maxAutoHeight, minHeightInRows);

              // We need to make sure that the canvas widget doesn't have
              // any extra scroll, to this end, we need to add the `minHeight` update
              // for the canvas widgets. Canvas Widgets are never updated in other flows
              // As they simply take up whatever space the parent has, but this doesn't effect
              // the `minHeight`, which leads to scroll if the `minHeight` is a larger value.
              // Also, for canvas widgets, the values are in pure pixels instead of rows.
              widgetsToUpdate[parentCanvasWidgetId] = [
                {
                  propertyPath: "bottomRow",
                  propertyValue:
                    maxBottomRow * GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
                },
                {
                  propertyPath: "minHeight",
                  propertyValue:
                    maxBottomRow * GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
                },
              ];

              // Convert this change into the standard expected update format.
              const expectedUpdate = {
                widgetId: parentContainerLikeWidget.widgetId,
                expectedHeightinPx:
                  minHeightInRows * GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
                expectedChangeInHeightInRows:
                  minHeightInRows -
                  (parentContainerLikeWidget.bottomRow -
                    parentContainerLikeWidget.topRow),
                currentTopRow: parentContainerLikeWidget.topRow,
                currentBottomRow: parentContainerLikeWidget.bottomRow,
                expectedBottomRow:
                  parentContainerLikeWidget.topRow + minHeightInRows,
                parentId: parentContainerLikeWidget.parentId,
              };

              // If this widget is actually removed from the layout
              // For example, if this is a ModalWidget
              // We need to make sure that we change properties other than bottomRow and topRow
              // In this case we're updating minHeight and height as well.

              // TODO(abhinav): Why do we need another offset for Modal widget particularly.
              if (parentContainerLikeWidget.detachFromLayout) {
                // DRY this
                widgetsToUpdate[parentContainerLikeWidget.widgetId] = [
                  {
                    propertyPath: "bottomRow",
                    propertyValue:
                      minHeightInRows * GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
                  },
                  {
                    propertyPath: "height",
                    propertyValue:
                      (minHeightInRows + GridDefaults.CANVAS_EXTENSION_OFFSET) *
                      GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
                  },
                  {
                    propertyPath: "minHeight",
                    propertyValue:
                      (minHeightInRows + GridDefaults.CANVAS_EXTENSION_OFFSET) *
                      GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
                  },
                ];
              }

              // If this is not a widget which is outside of the layout,
              // We must check if it has a parent
              // It most likely will, as this widget cannot be the MainContainer
              // The maincontainer is a Canvas Widget, not a container like widget.
              if (
                !parentContainerLikeWidget.detachFromLayout &&
                parentContainerLikeWidget.parentId
              ) {
                // If this widget's parent canvas already has some updates
                // We push this update to the existing array.
                // DRY THIS
                if (
                  expectedUpdatesGroupedByParentCanvasWidget.hasOwnProperty(
                    parentContainerLikeWidget.parentId,
                  )
                ) {
                  expectedUpdatesGroupedByParentCanvasWidget[
                    parentContainerLikeWidget.parentId
                  ].push(expectedUpdate);
                } else {
                  // Otherwise, we add a new entry.
                  expectedUpdatesGroupedByParentCanvasWidget[
                    parentContainerLikeWidget.parentId
                  ] = [expectedUpdate];
                }

                // The parent might not have been added to the previously created group
                // parentCanvasWidgetGroupedByLevel
                const _level =
                  canvasLevelMap[parentContainerLikeWidget.parentId];
                // So, we add it, if it is not the MainContainer.
                // This way it will be used in parentCanvasWidgetsToConsider
                // MainContainer was added when we initialised this variable,
                // so we're skipping it. level === 0 is true only for the MainContainer.
                if (_level !== 0) {
                  // DRY THIS
                  parentCanvasWidgetsGroupedByLevel[_level] = uniq([
                    ...(parentCanvasWidgetsGroupedByLevel[_level] || []),
                    parentContainerLikeWidget.parentId,
                  ]);
                }
              }
            }
          }
        }
      }
    }
    // Let's consider the minimum Canvas Height
    let maxCanvasHeight = CANVAS_DEFAULT_MIN_HEIGHT_PX;
    // The same logic to compute the minimum height of the MainContainer
    // Based on how many rows are being occuped by children.

    const maxPossibleCanvasHeight: number = yield getMinHeightBasedOnChildren(
      MAIN_CONTAINER_WIDGET_ID,
      changesSoFar,
    );

    maxCanvasHeight = Math.max(
      maxPossibleCanvasHeight * GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
      maxCanvasHeight,
    );

    // Add the MainContainer's update.
    widgetsToUpdate[MAIN_CONTAINER_WIDGET_ID] = [
      {
        propertyPath: "bottomRow",
        propertyValue:
          maxCanvasHeight +
          GridDefaults.CANVAS_EXTENSION_OFFSET *
            GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
      },
    ];

    // Convert the changesSoFar (this are the computed changes)
    // To the widgetsToUpdate data structure for final reducer update.
    for (const changedWidgetId in changesSoFar) {
      const hasScroll = Object.values(expectedUpdates).find(
        (entry) => entry.widgetId === changedWidgetId,
      )?.hasScroll;
      const { originalBottomRow, originalTopRow } = autoHeightLayoutTree[
        changedWidgetId
      ];

      widgetsToUpdate[changedWidgetId] = [
        {
          propertyPath: "bottomRow",
          propertyValue: changesSoFar[changedWidgetId].bottomRow,
        },
        {
          propertyPath: "topRow",
          propertyValue: changesSoFar[changedWidgetId].topRow,
        },
        {
          propertyPath: "originalTopRow",
          propertyValue: originalTopRow,
        },
        {
          propertyPath: "originalBottomRow",
          propertyValue: originalBottomRow,
        },
      ];
      if (hasScroll) {
        const containerLikeWidget = stateWidgets[changedWidgetId];

        if (
          Array.isArray(containerLikeWidget.children) &&
          containerLikeWidget.children.length > 0
        ) {
          const childWidgetId:
            | string
            | undefined = yield getChildOfContainerLikeWidget(
            containerLikeWidget,
          );
          if (childWidgetId) {
            let canvasHeight: number = yield getMinHeightBasedOnChildren(
              childWidgetId,
              changesSoFar,
            );
            canvasHeight += GridDefaults.CANVAS_EXTENSION_OFFSET;
            const propertyUpdates = [
              {
                propertyPath: "minHeight",
                propertyValue:
                  canvasHeight * GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
              },
              {
                propertyPath: "bottomRow",
                propertyValue:
                  canvasHeight * GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
              },
            ];

            containerLikeWidget.children.forEach((childWidgetId) => {
              if (!widgetsToUpdate.hasOwnProperty(childWidgetId)) {
                widgetsToUpdate[childWidgetId] = propertyUpdates;
              }
            });
          }
        }
      }
    }
  }

  log.debug("Dynamic height: Widgets to update:", { widgetsToUpdate });

  if (Object.keys(widgetsToUpdate).length > 0) {
    // Push all updates to the CanvasWidgetsReducer.
    // Note that we're not calling `UPDATE_LAYOUT`
    // as we don't need to trigger an eval
    yield put(updateMultipleWidgetProperties(widgetsToUpdate));
    resetAutoHeightUpdateQueue();
    yield put(generateDynamicHeightComputationTree(false, false));
  }

  log.debug(
    "Dynamic Height: Overall time taken: ",
    performance.now() - start,
    "ms",
  );
}

// TODO(abhinav): Remove these when these are added via another PR.
function generateDynamicHeightComputationTree(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  arg0: boolean,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  arg1: boolean,
): any {
  throw new Error("Function not implemented.");
}
function updateMultipleWidgetProperties(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  widgetsToUpdate: Record<
    string,
    Array<{ propertyPath: string; propertyValue: unknown }>
  >,
): any {
  throw new Error("Function not implemented.");
}
function computeChangeInPositionBasedOnDelta(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  autoHeightLayoutTree: Record<string, TreeNode>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  delta: Record<string, number>,
) {
  throw new Error("Function not implemented.");
}
