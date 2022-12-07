import { CANVAS_DEFAULT_MIN_HEIGHT_PX } from "constants/AppConstants";
import {
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import { groupBy, uniq } from "lodash";
import log from "loglevel";
import {
  CanvasWidgetsReduxState,
  UpdateWidgetsPayload,
} from "reducers/entityReducers/canvasWidgetsReducer";
import { put, select } from "redux-saga/effects";
import { getWidgets } from "sagas/selectors";
import { getCanvasHeightOffset } from "selectors/editorSelectors";
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
  getParentCurrentHeightInRows,
  shouldWidgetsCollapse,
} from "./helpers";
import { updateMultipleWidgetPropertiesAction } from "actions/controlActions";
import { generateAutoHeightLayoutTreeAction } from "actions/autoHeightActions";
import { computeChangeInPositionBasedOnDelta } from "utils/autoHeight/reflow";
import { CanvasLevelsReduxState } from "reducers/entityReducers/autoHeightReducers/canvasLevelsReducer";
import { getCanvasLevelMap } from "selectors/autoHeightSelectors";
import { getLayoutTree } from "./layoutTree";

/* TODO(abhinav)
  hasScroll is no longer needed, as the only way we will be computing for hasScroll, is when we get the updates
  from the Container computations saga. In container computations, we also compute the inner canvas height. So,
  this becomes a duplicate run of pretty much the same code.

  In most cases, when we run the getMinHeightBasedOnChildren, we add the CANVAS_EXTENSION_OFFSET and the offset
  from the widget configuration. This means that we can DRY this by moving them into the getMinHeightBasedOnChildren function

  The computations we do when a widget changes for its parent, is pretty much the same as the ones we do in container 
  computations saga, so we can potentially re-use that code.

  Adding to widgetsToUpdate can be done using one function and shrink this saga by a large amount

  

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
  log.debug("Dynamic Height: updates to process", { updates });
  const start = performance.now();
  let shouldRecomputeContainers = false;

  const shouldCollapse: boolean = yield shouldWidgetsCollapse();

  const { tree: dynamicHeightLayoutTree } = yield getLayoutTree(false);

  // Get all widgets from canvasWidgetsReducer
  const stateWidgets: CanvasWidgetsReduxState = yield select(getWidgets);

  // Initialise all the widgets we will be updating
  const widgetsToUpdate: UpdateWidgetsPayload = {};

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

  // For each widget which have new heights to update.
  for (const widgetId in updates) {
    // Get the widget from the reducer.
    const widget: FlattenedWidgetProps = stateWidgets[widgetId];
    // If this widget exists (not sure why this needs to be here)
    if (widget && !widget.detachFromLayout) {
      // Get the boundaries for possible min and max dynamic height.
      let minDynamicHeightInPixels =
        getWidgetMinAutoHeight(widget) * GridDefaults.DEFAULT_GRID_ROW_HEIGHT;

      if (widget.type === "TABS_WIDGET") shouldRecomputeContainers = true;

      // In case of a widget going invisible in view mode
      if (updates[widgetId] === 0) {
        if (shouldCollapse && isAutoHeightEnabledForWidget(widget)) {
          minDynamicHeightInPixels = 0;
        } else continue;
      }

      const maxDynamicHeightInPixels =
        getWidgetMaxAutoHeight(widget) * GridDefaults.DEFAULT_GRID_ROW_HEIGHT;
      let newHeightInPixels = updates[widgetId];

      // If the new height is below the min threshold
      if (newHeightInPixels < minDynamicHeightInPixels) {
        newHeightInPixels = minDynamicHeightInPixels;
      }
      // If the new height is above the max threshold
      if (newHeightInPixels > maxDynamicHeightInPixels) {
        newHeightInPixels = maxDynamicHeightInPixels;
      }

      const expectedHeightInRows = Math.ceil(
        newHeightInPixels / GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
      );

      const treeLayoutData = dynamicHeightLayoutTree[widget.widgetId];

      const currentHeightInRows =
        treeLayoutData.bottomRow - treeLayoutData.topRow;

      // Push the updates into the initialised array.
      expectedUpdates.push({
        widgetId,
        expectedHeightinPx: newHeightInPixels,
        expectedChangeInHeightInRows:
          expectedHeightInRows - currentHeightInRows,
        currentTopRow: treeLayoutData.topRow,
        currentBottomRow: treeLayoutData.bottomRow,
        expectedBottomRow: Math.ceil(
          treeLayoutData.topRow +
            newHeightInPixels / GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
        ),
        parentId: widget.parentId,
      });
    } else if (widget) {
      // For widgets like Modal Widget. (Rather this assumes that it is only the modal widget which needs a change)
      const newHeight = updates[widgetId];

      // Setting the height and dimensions of the Modal Widget
      widgetsToUpdate[widgetId] = [
        {
          propertyPath: "height",
          propertyValue: newHeight,
        },
        {
          propertyPath: "bottomRow",
          propertyValue: widget.topRow + newHeight,
        },
        {
          propertyPath: "topRow",
          propertyValue: widget.topRow,
        },
      ];
      // Setting the child canvas widget's dimensions in the Modal Widget
      if (Array.isArray(widget.children) && widget.children.length === 1) {
        widgetsToUpdate[widget.children[0]] = [
          {
            propertyPath: "minHeight",
            propertyValue: newHeight,
          },
          {
            propertyPath: "bottomRow",
            propertyValue: newHeight,
          },
          {
            propertyPath: "topRow",
            propertyValue: 0,
          },
        ];
      }
    }
  }

  // If there are updates.
  if (expectedUpdates.length > 0) {
    // Get the canvas level map from the store
    // This map tells us the nesting of each canvas widget in the DSL.
    // MainContainer's level is 0.
    const canvasLevelMap: CanvasLevelsReduxState = yield select(
      getCanvasLevelMap,
    );
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
          dynamicHeightLayoutTree,
          delta,
        );

        // Add to the changes so far, the changes computed for this canvas widget's children.
        changesSoFar = Object.assign(changesSoFar, siblingWidgetsToUpdate);

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

            let minCanvasHeightInRows: number = yield getMinHeightBasedOnChildren(
              parentCanvasWidget.widgetId,
              changesSoFar,
              true,
              dynamicHeightLayoutTree,
            );

            // Add extra rows, this is to accommodate for padding and margins in the parent
            minCanvasHeightInRows += GridDefaults.CANVAS_EXTENSION_OFFSET;

            // For widgets like Tabs Widget, some of the height is occupied by the
            // tabs themselves, the child canvas as a result has less number of rows available
            // To accommodate for this, we need to increase the new height by the offset amount.
            const canvasHeightOffset: number = getCanvasHeightOffset(
              parentContainerLikeWidget.type,
              parentContainerLikeWidget,
            );

            // Widgets need to consider changing heights, only if they have dynamic height
            // enabled.
            if (isAutoHeightEnabledForWidget(parentContainerLikeWidget)) {
              // Get the minimum number of rows this parent must have

              let minHeightInRows = getWidgetMinAutoHeight(
                parentContainerLikeWidget,
              );

              minHeightInRows = Math.max(
                minHeightInRows,
                minCanvasHeightInRows + canvasHeightOffset,
              );

              // Setting this in a variable, as this will be the total scroll height in the canvas.
              const minCanvasHeightInPixels =
                (minHeightInRows - canvasHeightOffset) *
                GridDefaults.DEFAULT_GRID_ROW_HEIGHT;

              // We need to make sure that the canvas widget doesn't have
              // any extra scroll, to this end, we need to add the `minHeight` update
              // for the canvas widgets. Canvas Widgets are never updated in other flows
              // As they simply take up whatever space the parent has, but this doesn't effect
              // the `minHeight`, which leads to scroll if the `minHeight` is a larger value.
              // Also, for canvas widgets, the values are in pure pixels instead of rows.
              widgetsToUpdate[parentCanvasWidgetId] = [
                {
                  propertyPath: "bottomRow",
                  propertyValue: minCanvasHeightInPixels,
                },
                {
                  propertyPath: "minHeight",
                  propertyValue: minCanvasHeightInPixels,
                },
              ];

              // Make sure we're not overflowing the max height bounds
              const maxDynamicHeight = getWidgetMaxAutoHeight(
                parentContainerLikeWidget,
              );

              minHeightInRows = Math.min(maxDynamicHeight, minHeightInRows);

              let layoutData =
                dynamicHeightLayoutTree[parentContainerLikeWidget.widgetId];

              if (layoutData === undefined) {
                layoutData = parentContainerLikeWidget;
              }

              // Convert this change into the standard expected update format.
              const expectedUpdate = {
                widgetId: parentContainerLikeWidget.widgetId,
                expectedHeightinPx:
                  minHeightInRows * GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
                expectedChangeInHeightInRows:
                  minHeightInRows - (layoutData.bottomRow - layoutData.topRow),
                currentTopRow: layoutData.topRow,
                currentBottomRow: layoutData.bottomRow,
                expectedBottomRow: layoutData.topRow + minHeightInRows,
                parentId: parentContainerLikeWidget.parentId,
              };

              // If this widget is actually removed from the layout
              // For example, if this is a ModalWidget
              // We need to make sure that we change properties other than bottomRow and topRow
              // In this case we're updating minHeight and height as well.
              if (parentContainerLikeWidget.detachFromLayout) {
                // DRY this
                widgetsToUpdate[parentContainerLikeWidget.widgetId] = [
                  {
                    propertyPath: "bottomRow",
                    propertyValue: minHeightInRows,
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
            } else {
              // Get the parent's topRow and bottomRow from the state
              let parentBottomRow = parentContainerLikeWidget.bottomRow;
              let parentTopRow = parentContainerLikeWidget.topRow;
              // If we have the parent's dimensions in the tree
              // and it is not a modal widget, then get the topRow
              // and bottomRow from the tree.
              if (
                dynamicHeightLayoutTree[parentContainerLikeWidget.widgetId] &&
                !parentContainerLikeWidget.detachFromLayout
              ) {
                parentBottomRow =
                  dynamicHeightLayoutTree[parentContainerLikeWidget.widgetId]
                    .bottomRow;
                parentTopRow =
                  dynamicHeightLayoutTree[parentContainerLikeWidget.widgetId]
                    .topRow;
              }

              // If this is a modal widget, then get the bottomRow in rows
              // as the height and bottomRow could be in pixels.
              if (
                parentContainerLikeWidget.detachFromLayout &&
                parentContainerLikeWidget.height
              ) {
                parentBottomRow =
                  parentTopRow +
                  Math.ceil(
                    parentContainerLikeWidget.height /
                      GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
                  );
              }

              // Get the parent container's height in rows
              // It is possible that some other update has changed this parent's
              // dimensions.
              let parentContainerHeightInRows = getParentCurrentHeightInRows(
                parentBottomRow,
                parentTopRow,
                parentContainerLikeWidget.widgetId,
                changesSoFar,
              );

              parentContainerHeightInRows -= canvasHeightOffset;

              // Setting this in a variable, as this will be the total scroll height in the canvas.
              const minCanvasHeightInPixels =
                Math.max(minCanvasHeightInRows, parentContainerHeightInRows) *
                GridDefaults.DEFAULT_GRID_ROW_HEIGHT;

              // We need to make sure that the canvas widget doesn't have
              // any extra scroll, to this end, we need to add the `minHeight` update
              // for the canvas widgets. Canvas Widgets are never updated in other flows
              // As they simply take up whatever space the parent has, but this doesn't effect
              // the `minHeight`, which leads to scroll if the `minHeight` is a larger value.
              // Also, for canvas widgets, the values are in pure pixels instead of rows.
              widgetsToUpdate[parentCanvasWidgetId] = [
                {
                  propertyPath: "bottomRow",
                  propertyValue: minCanvasHeightInPixels,
                },
                {
                  propertyPath: "minHeight",
                  propertyValue: minCanvasHeightInPixels,
                },
              ];
            }
          }
        }
      }
    }
    // Let's consider the minimum Canvas Height
    let maxCanvasHeightInRows =
      CANVAS_DEFAULT_MIN_HEIGHT_PX / GridDefaults.DEFAULT_GRID_ROW_HEIGHT;
    // The same logic to compute the minimum height of the MainContainer
    // Based on how many rows are being occuped by children.

    const maxPossibleCanvasHeightInRows: number = yield getMinHeightBasedOnChildren(
      MAIN_CONTAINER_WIDGET_ID,
      changesSoFar,
      true,
      dynamicHeightLayoutTree,
    );

    maxCanvasHeightInRows = Math.max(
      maxPossibleCanvasHeightInRows,
      maxCanvasHeightInRows,
    );

    // Add the MainContainer's update.
    widgetsToUpdate[MAIN_CONTAINER_WIDGET_ID] = [
      {
        propertyPath: "bottomRow",
        propertyValue:
          (maxCanvasHeightInRows + GridDefaults.MAIN_CANVAS_EXTENSION_OFFSET) *
          GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
      },
    ];

    // Convert the changesSoFar (this are the computed changes)
    // To the widgetsToUpdate data structure for final reducer update.

    for (const changedWidgetId in changesSoFar) {
      const { originalBottomRow, originalTopRow } = dynamicHeightLayoutTree[
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
          const childCanvasWidget = stateWidgets[childWidgetId];
          const isCanvasWidget = childCanvasWidget?.type === "CANVAS_WIDGET";
          if (isCanvasWidget) {
            let canvasHeight: number = yield getMinHeightBasedOnChildren(
              childWidgetId,
              changesSoFar,
              false,
              dynamicHeightLayoutTree,
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
    yield put(updateMultipleWidgetPropertiesAction(widgetsToUpdate));
    resetAutoHeightUpdateQueue();
    yield put(
      generateAutoHeightLayoutTreeAction(shouldRecomputeContainers, false),
    );
  }

  log.debug(
    "Dynamic Height: Overall time taken: ",
    performance.now() - start,
    "ms",
  );
}
