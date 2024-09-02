import { CANVAS_DEFAULT_MIN_HEIGHT_PX } from "constants/AppConstants";
import {
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import { groupBy, uniq } from "lodash";
import log from "loglevel";
import type {
  CanvasWidgetsReduxState,
  UpdateWidgetsPayload,
} from "reducers/entityReducers/canvasWidgetsReducer";
import { put, select } from "redux-saga/effects";
import { getCanvasHeightOffset } from "utils/WidgetSizeUtils";
import type { FlattenedWidgetProps } from "WidgetProvider/constants";
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
  mutation_setPropertiesToUpdate,
  shouldCollapseThisWidget,
} from "./helpers";
import { updateMultipleWidgetPropertiesAction } from "actions/controlActions";
import type { UpdateWidgetAutoHeightPayload } from "actions/autoHeightActions";
import { generateAutoHeightLayoutTreeAction } from "actions/autoHeightActions";
import { computeChangeInPositionBasedOnDelta } from "utils/autoHeight/reflow";
import type { CanvasLevelsReduxState } from "reducers/entityReducers/autoHeightReducers/canvasLevelsReducer";
import {
  getAutoHeightLayoutTree,
  getCanvasLevelMap,
} from "selectors/autoHeightSelectors";
import { getLayoutTree } from "./layoutTree";
import WidgetFactory from "WidgetProvider/factory";
import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import type { TreeNode } from "utils/autoHeight/constants";
import { directlyMutateDOMNodes } from "utils/autoHeight/mutateDOM";
import { getAppMode } from "ee/selectors/entitiesSelector";
import { APP_MODE } from "entities/App";
import {
  getDimensionMap,
  getIsAutoLayout,
  getWidgetsForBreakpoint,
} from "selectors/editorSelectors";

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
export function* updateWidgetAutoHeightSaga(
  action?: ReduxAction<UpdateWidgetAutoHeightPayload>,
) {
  const start = performance.now();
  let shouldRecomputeContainers = false;
  let shouldEval = false;

  const appMode: APP_MODE = yield select(getAppMode);

  let updates = getAutoHeightUpdateQueue();

  let dynamicHeightLayoutTree: Record<string, TreeNode>;

  const widgetsMeasuredInPixels = [];
  const widgetCanvasOffsets: Record<string, number> = {};

  // Get all widgets from canvasWidgetsReducer
  const stateWidgets: CanvasWidgetsReduxState = yield select(
    getWidgetsForBreakpoint,
  );

  if (action?.payload) {
    const offset = getCanvasHeightOffset(
      stateWidgets[action.payload.widgetId].type,
      stateWidgets[action.payload.widgetId],
    );

    updates = {
      [action.payload.widgetId]:
        action.payload.height + offset * GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
    };
    /* Creating a new type called dynamicHeightLayoutTree. */
    dynamicHeightLayoutTree = yield select(getAutoHeightLayoutTree);
  } else {
    const result: {
      tree: Record<string, TreeNode>;
      canvasLevelsMap: Record<string, number>;
    } = yield getLayoutTree(false);
    dynamicHeightLayoutTree = result.tree;
  }

  log.debug("Auto Height: updates to process", { updates });

  // Initialise all the widgets we will be updating
  let widgetsToUpdate: UpdateWidgetsPayload = {};

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
      const config = WidgetFactory.widgetConfigMap.get(widget.type);
      if (config && config.needsHeightForContent) {
        shouldEval = true;
      }

      // In case of a widget going invisible in view mode
      if (updates[widgetId] === 0) {
        // Should we allow zero height for this widget?
        const shouldCollapse: boolean = yield shouldCollapseThisWidget(
          stateWidgets,
          widgetId,
        );

        // If zero height is allowed
        if (shouldCollapse) {
          // setting the min to be 0, will take care of things with the same algorithm
          minDynamicHeightInPixels = 0;
          // We also need a way to reset this widget if it is fixed, this is because,
          // for fixed widgets, auto height doesn't trigger, and there is a chance
          // that the widget will remain the same zero height even after they become
          // visible.
          // To do this, we're going to add some extra properties which we can later use to reset
          if (
            !isAutoHeightEnabledForWidget(widget) &&
            widget.topRow !== widget.bottomRow
          ) {
            widgetsToUpdate = mutation_setPropertiesToUpdate(
              widgetsToUpdate,
              widgetId,
              {
                topRowBeforeCollapse: widget.topRow + 0,
                bottomRowBeforeCollapse: widget.bottomRow + 0,
              },
            );
          }
        } else {
          continue;
        }
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

      widgetsMeasuredInPixels.push(widgetId);

      // Setting the height and dimensions of the Modal Widget
      widgetsToUpdate = mutation_setPropertiesToUpdate(
        widgetsToUpdate,
        widgetId,
        {
          height: newHeight,
          bottomRow: widget.topRow + newHeight,
          topRow: widget.topRow,
        },
      );
    }
  }

  // If there are updates.
  if (expectedUpdates.length > 0) {
    // Get the canvas level map from the store
    // This map tells us the nesting of each canvas widget in the DSL.
    // MainContainer's level is 0.
    const canvasLevelMap: CanvasLevelsReduxState =
      yield select(getCanvasLevelMap);
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
    let changesSoFar: Record<string, { topRow: number; bottomRow: number }> =
      {};

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
            ].forEach(
              (update: {
                widgetId: string;
                expectedChangeInHeightInRows: number;
              }) => {
                delta[update.widgetId] = update.expectedChangeInHeightInRows;
              },
            );
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

            // Get the child we need to consider
            // For a container widget, it will be the child canvas
            // For a tabs widget, it will be the currently open tab's canvas
            const childWidgetId: string | undefined =
              yield getChildOfContainerLikeWidget(parentContainerLikeWidget);
            // Skip computations for the parent container like widget
            // if this child canvas is not the one currently visible
            if (childWidgetId !== parentCanvasWidget.widgetId) continue;

            let minCanvasHeightInRows: number =
              yield getMinHeightBasedOnChildren(
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

              // Make sure we're not overflowing the max height bounds
              const maxDynamicHeight = getWidgetMaxAutoHeight(
                parentContainerLikeWidget,
              );

              minHeightInRows = Math.min(maxDynamicHeight, minHeightInRows);

              let layoutData =
                dynamicHeightLayoutTree[parentContainerLikeWidget.widgetId];

              if (layoutData === undefined) {
                layoutData = {
                  bottomRow: parentContainerLikeWidget.bottomRow,
                  topRow: parentContainerLikeWidget.topRow,
                  aboves: [],
                  belows: [],
                  originalBottomRow: parentContainerLikeWidget.bottomRow,
                  originalTopRow: parentContainerLikeWidget.topRow,
                  distanceToNearestAbove: 0,
                };
              }

              // If this widget is actually removed from the layout
              // For example, if this is a ModalWidget
              // We need to make sure that we change properties other than bottomRow and topRow
              // In this case we're updating minHeight and height as well.
              if (parentContainerLikeWidget.detachFromLayout) {
                widgetsMeasuredInPixels.push(
                  parentContainerLikeWidget.widgetId,
                );

                // DRY this
                widgetsToUpdate = mutation_setPropertiesToUpdate(
                  widgetsToUpdate,
                  parentContainerLikeWidget.widgetId,
                  {
                    bottomRow: minHeightInRows,
                    height:
                      minHeightInRows * GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
                    minHeight:
                      minHeightInRows * GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
                  },
                );
              }

              // If the parent container is trying to collapse already
              // Then the changes in the child should not effect the parent
              // For this we need to check for two different scenarios
              // 1. The parent is collapsing in this computation cycle
              // 2. The parent is already collapsed and should stay collapsed

              // Get the parent from existing updates in this computation
              // cycle.
              const existingUpdate = expectedUpdates.find(
                (update) =>
                  update.widgetId === parentContainerLikeWidget.widgetId,
              );

              // Check if the parent has collapsed previously
              // And it needs to stay collapsed
              const shouldCollapseParent =
                shouldCollapseThisWidget(
                  stateWidgets,
                  parentContainerLikeWidget.widgetId,
                ) &&
                parentContainerLikeWidget.topRow ===
                  parentContainerLikeWidget.bottomRow &&
                !existingUpdate;

              // If both the above conditions are false
              // Then update the expected updates for further
              // computations
              if (
                (existingUpdate === undefined ||
                  existingUpdate.expectedHeightinPx !== 0) &&
                !shouldCollapseParent
              ) {
                // Convert this change into the standard expected update format.
                const expectedUpdate = {
                  widgetId: parentContainerLikeWidget.widgetId,
                  expectedHeightinPx:
                    minHeightInRows * GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
                  expectedChangeInHeightInRows:
                    minHeightInRows -
                    (layoutData.bottomRow - layoutData.topRow),
                  currentTopRow: layoutData.topRow,
                  currentBottomRow: layoutData.bottomRow,
                  expectedBottomRow: layoutData.topRow + minHeightInRows,
                  parentId: parentContainerLikeWidget.parentId,
                };
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
    }
    // Let's consider the minimum Canvas Height
    const mainContainerMinHeight =
      stateWidgets[MAIN_CONTAINER_WIDGET_ID].minHeight;
    const canvasMinHeight: number =
      appMode === APP_MODE.EDIT && mainContainerMinHeight !== undefined
        ? mainContainerMinHeight
        : CANVAS_DEFAULT_MIN_HEIGHT_PX;
    let maxCanvasHeightInRows =
      canvasMinHeight / GridDefaults.DEFAULT_GRID_ROW_HEIGHT;

    // The same logic to compute the minimum height of the MainContainer
    // Based on how many rows are being occuped by children.

    const maxPossibleCanvasHeightInRows: number =
      yield getMinHeightBasedOnChildren(
        MAIN_CONTAINER_WIDGET_ID,
        changesSoFar,
        true,
        dynamicHeightLayoutTree,
      );

    maxCanvasHeightInRows = Math.max(
      maxPossibleCanvasHeightInRows,
      maxCanvasHeightInRows,
    );

    widgetsMeasuredInPixels.push(MAIN_CONTAINER_WIDGET_ID);

    // Add the MainContainer's update.
    widgetsToUpdate = mutation_setPropertiesToUpdate(
      widgetsToUpdate,
      MAIN_CONTAINER_WIDGET_ID,
      {
        bottomRow: maxCanvasHeightInRows * GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
      },
    );

    // Convert the changesSoFar (this are the computed changes)
    // To the widgetsToUpdate data structure for final reducer update.

    for (const changedWidgetId in changesSoFar) {
      const { originalBottomRow, originalTopRow } =
        dynamicHeightLayoutTree[changedWidgetId];

      const canvasOffset = getCanvasHeightOffset(
        stateWidgets[changedWidgetId].type,
        stateWidgets[changedWidgetId],
      );

      widgetCanvasOffsets[changedWidgetId] = canvasOffset;

      widgetsToUpdate = mutation_setPropertiesToUpdate(
        widgetsToUpdate,
        changedWidgetId,
        {
          bottomRow: changesSoFar[changedWidgetId].bottomRow,
          topRow: changesSoFar[changedWidgetId].topRow,
          originalTopRow: originalTopRow,
          originalBottomRow: originalBottomRow,
        },
      );
    }
  }

  log.debug("Auto height: Widgets to update:", { widgetsToUpdate });

  if (Object.keys(widgetsToUpdate).length > 0) {
    let enhancedWidgetUpdates = widgetsToUpdate;
    const isAutoLayout: boolean = yield select(getIsAutoLayout);
    if (isAutoLayout) {
      // Enhance widget updates based on breakpoint
      const dimensionMap: {
        leftColumn: string;
        rightColumn: string;
        topRow: string;
        bottomRow: string;
      } = yield select(getDimensionMap);
      const dimensions = Object.keys(dimensionMap);
      enhancedWidgetUpdates = Object.keys(widgetsToUpdate).reduce(
        (allWidgetsToUpdate, updatingWidget) => {
          const widget = widgetsToUpdate[updatingWidget];
          const enhancedUpdates = widget.map((eachUpdate) => {
            if (dimensions.includes(eachUpdate.propertyPath)) {
              // TODO: Fix this the next time the file is edited
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              eachUpdate.propertyPath = (dimensionMap as any)[
                eachUpdate.propertyPath
              ];
            }
            return eachUpdate;
          });
          return {
            ...allWidgetsToUpdate,
            [updatingWidget]: enhancedUpdates,
          };
        },
        widgetsToUpdate,
      );
    }

    if (!action?.payload) {
      // Push all updates to the CanvasWidgetsReducer.
      // Note that we're not calling `UPDATE_LAYOUT`
      // as we don't need to trigger an eval
      yield put(
        updateMultipleWidgetPropertiesAction(enhancedWidgetUpdates, shouldEval),
      );
      resetAutoHeightUpdateQueue();
      yield put(
        generateAutoHeightLayoutTreeAction(
          false,
          false,
          shouldRecomputeContainers,
        ),
      );
    }
    directlyMutateDOMNodes(
      enhancedWidgetUpdates as Record<
        string,
        Array<{ propertyPath: string; propertyValue: number }>
      >,
      widgetsMeasuredInPixels,
      widgetCanvasOffsets,
    );
  }

  log.debug(
    "Dynamic Height: Overall time taken: ",
    performance.now() - start,
    "ms",
  );
}
