import {
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { setDynamicHeightLayoutTree } from "actions/canvasActions";
import { UpdateWidgetDynamicHeightPayload } from "actions/controlActions";
import { checkContainersForDynamicHeightUpdate } from "ce/actions/dynamicHeightActions";
import {
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
  WidgetHeightLimits,
} from "constants/WidgetConstants";
import { groupBy } from "lodash";
import log from "loglevel";
import {
  CanvasWidgetsReduxState,
  UpdateWidgetsPayload,
} from "reducers/entityReducers/canvasWidgetsReducer";
import { CanvasLevelsReduxState } from "reducers/entityReducers/dynamicHeightReducers/canvasLevelsReducer";
import { DynamicHeightLayoutTreeReduxState } from "reducers/entityReducers/dynamicHeightReducers/dynamicHeightLayoutTreeReducer";
import {
  all,
  cancel,
  put,
  select,
  takeEvery,
  takeLatest,
  fork,
  delay,
} from "redux-saga/effects";
import {
  getCanvasHeightOffset,
  getOccupiedSpacesGroupedByParentCanvas,
} from "selectors/editorSelectors";
import {
  getCanvasLevelMap,
  getDynamicHeightLayoutTree,
} from "selectors/widgetReflowSelectors";
import {
  computeChangeInPositionBasedOnDelta,
  generateTree,
  TreeNode,
} from "utils/treeManipulationHelpers/dynamicHeightReflow";
import { FlattenedWidgetProps } from "widgets/constants";
import {
  getWidgetMaxDynamicHeight,
  getWidgetMinDynamicHeight,
  isDynamicHeightEnabledForWidget,
} from "widgets/WidgetUtils";
import { getWidgets } from "./selectors";

/**
 * Saga to update a widget's dynamic height
 * When a widget changes in height, it must do the following
 * - Make sure any parent that should also change height accordingly, does so
 * - Make sure any widget that needs to reposition due to the above changes, does so
 *
 *
 * TODO: PERF_TRACK(abhinav): Make sure to benchmark the computations. We need to propagate changes within 10ms
 */
export function* updateWidgetDynamicHeightSaga(
  updates: Record<string, number>,
) {
  // Wait for 100 ms while all updates come through
  yield delay(100);
  const start = performance.now();

  log.debug("Dynamic height: Call for updates: ", { updates });

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
  }> = [];

  // For each widget which have new heights to update.
  for (const widgetId in updates) {
    // Get the widget from the reducer.
    const widget: FlattenedWidgetProps = stateWidgets[widgetId];
    // If this widget exists (not sure why this needs to be here)
    if (widget && !widget.detachFromLayout) {
      // Get the boundaries for possible min and max dynamic height.
      const minDynamicHeightInPixels =
        getWidgetMinDynamicHeight(widget) *
        GridDefaults.DEFAULT_GRID_ROW_HEIGHT;
      const maxDynamicHeightInPixels =
        getWidgetMaxDynamicHeight(widget) *
        GridDefaults.DEFAULT_GRID_ROW_HEIGHT;
      let newHeightInPixels = updates[widgetId];

      // If the new height is below the min threshold
      if (newHeightInPixels < minDynamicHeightInPixels) {
        newHeightInPixels = minDynamicHeightInPixels;
      }
      // If the new height is above the max threshold
      if (newHeightInPixels > maxDynamicHeightInPixels) {
        newHeightInPixels = maxDynamicHeightInPixels;
      }
      // Push the updates into the initialised array.
      expectedUpdates.push({
        widgetId,
        expectedHeightinPx: newHeightInPixels,
        expectedChangeInHeightInRows:
          newHeightInPixels / GridDefaults.DEFAULT_GRID_ROW_HEIGHT -
          (widget.bottomRow - widget.topRow),
        currentTopRow: widget.topRow,
        currentBottomRow: widget.bottomRow,
        expectedBottomRow:
          widget.topRow +
          newHeightInPixels / GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
        parentId: widget.parentId,
      });
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
    // TODO (abhinav): So far it seems like expectedUpdatesGroupedByParent is only used here
    // If this turns out to be case, remove this variable and compute directly from expetedUpdates

    // For each canvas widget which has updates.
    for (const parentCanvasWidgetId in expectedUpdatesGroupedByParentCanvasWidget) {
      // Get the level of the canvas widget
      const _level = canvasLevelMap[parentCanvasWidgetId];

      // If the level is higher than the previous level, increment maxLevel
      if (_level > maxLevel) maxLevel = _level;

      // updateteh map with the canvas widgets in the current level.
      parentCanvasWidgetsGroupedByLevel[_level] = [
        ...(parentCanvasWidgetsGroupedByLevel[_level] || []),
        parentCanvasWidgetId,
      ];
    }

    // Get the tree data structure we will be using to compute updates
    const dynamicHeightLayoutTree: DynamicHeightLayoutTreeReduxState = yield select(
      getDynamicHeightLayoutTree,
    );

    log.debug("Dynamic height: Working with tree:", {
      dynamicHeightLayoutTree,
    });

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

      log.debug(
        "Dynamic height considering: ",
        { level },
        { parentCanvasWidgetsToConsider },
        { expectedUpdatesGroupedByParentCanvasWidget },
      );

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
          ].forEach((expectedUpdate) => {
            delta[expectedUpdate.widgetId] =
              expectedUpdate.expectedChangeInHeightInRows;
          });
        }
      });

      // 2. Run the reflow computations for  this parent's child updates
      const siblingWidgetsToUpdate = computeChangeInPositionBasedOnDelta(
        dynamicHeightLayoutTree,
        delta,
      );
      log.debug("Dynamic height: Computing sibling updates:", {
        siblingWidgetsToUpdate,
        dynamicHeightLayoutTree,
        delta,
        parentCanvasWidgetsToConsider,
      });

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

          // Widgets need to consider changing heights, only if they have dynamic height
          // enabled.
          if (isDynamicHeightEnabledForWidget(parentContainerLikeWidget)) {
            // Get the minimum number of rows this parent must have
            let minHeightInRows =
              parentContainerLikeWidget.minDynamicHeight ||
              WidgetHeightLimits.MIN_HEIGHT_IN_ROWS;

            // Get the array of children ids.
            // This cannot be [], because we came to this point due to an update
            // caused by one of the children.
            const children = parentCanvasWidget.children || []; // It's never going to be []

            // For each child widget id.
            for (const childWidgetId of children) {
              // If we've changed the widget's bottomRow via computations
              if (changesSoFar.hasOwnProperty(childWidgetId)) {
                minHeightInRows = Math.max(
                  minHeightInRows,
                  changesSoFar[childWidgetId].bottomRow,
                );
                // If we need to get the existing bottomRow from the state
              } else {
                const childWidget: FlattenedWidgetProps =
                  stateWidgets[childWidgetId];

                // We ignore widgets like ModalWidget which don't occupy parent's space.
                // detachFromLayout helps us identify such widgets
                if (!childWidget.detachFromLayout) {
                  minHeightInRows = Math.max(
                    minHeightInRows,
                    childWidget.bottomRow,
                  );
                }
              }
            }

            // Add extra rows, this is to accommodate for padding and margins in the parent
            minHeightInRows =
              minHeightInRows + GridDefaults.CANVAS_EXTENSION_OFFSET;

            // For widgets like Tabs Widget, some of the height is occupied by the
            // tabs themselves, the child canvas as a result has less number of rows available
            // To accommodate for this, we need to increase the new height by the offset amount.
            const canvasHeightOffset: number = yield select(
              getCanvasHeightOffset,
              parentContainerLikeWidget.type,
            );
            minHeightInRows += canvasHeightOffset;

            // Make sure we're not overflowing the max height bounds
            const maxDynamicHeight = getWidgetMaxDynamicHeight(
              parentContainerLikeWidget,
            );

            minHeightInRows = Math.min(maxDynamicHeight, minHeightInRows);

            log.debug("Dynamic height, updating parent:", {
              parentContainerLikeWidget,
              canvasHeightOffset,
              minHeightInRows,
            });

            // We need to make sure that the canvas widget doesn't have
            // any extra scroll, to this end, we need to add the `minHeight` update
            // for the canvas widgets. Canvas Widgets are never updated in other flows
            // As they simply take up whatever space the parent has, but this doesn't effect
            // the `minHeight`, which leads to scroll if the `minHeight` is a larger value.
            // Also, for canvas widgets, the values are in pure pixels instead of rows.
            if (widgetsToUpdate[parentCanvasWidgetId]) {
              widgetsToUpdate[parentCanvasWidgetId] = [
                {
                  propertyPath: "bottomRow",
                  propertyValue:
                    minHeightInRows * GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
                },
                {
                  propertyPath: "minHeight",
                  propertyValue:
                    minHeightInRows * GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
                },
              ];
            }

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

            log.debug("Dynamic height parent container like widget:", {
              parentContainerLikeWidget,
              type: parentContainerLikeWidget.type,
            });

            // If this widget is actually removed from the layout
            // For example, if this is a ModalWidget
            // We need to make sure that we change properties other than bottomRow and topRow
            // In this case we're updating minHeight and height as well.
            if (parentContainerLikeWidget.detachFromLayout) {
              widgetsToUpdate[parentContainerLikeWidget.widgetId] = [
                {
                  propertyPath: "bottomRow",
                  propertyValue:
                    minHeightInRows * GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
                },
                {
                  propertyPath: "height",
                  propertyValue:
                    minHeightInRows * GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
                },
                {
                  propertyPath: "minHeight",
                  propertyValue:
                    minHeightInRows * GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
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
              log.debug("Dynamic height: Adding parent update", {
                parentContainerLikeWidget,
                expectedUpdate,
              });
              // If this widget's parent canvas already has some updates
              // We push this update to the existing array.
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
              const _level = canvasLevelMap[parentContainerLikeWidget.parentId];
              // So, we add it, if it is not the MainContainer.
              // This way it will be used in parentCanvasWidgetsToConsider
              // MainContainer was added when we initialised this variable,
              // so we're skipping it. level === 0 is true only for the MainContainer.
              if (_level !== 0) {
                parentCanvasWidgetsGroupedByLevel[_level] = [
                  ...(parentCanvasWidgetsGroupedByLevel[_level] || []),
                  parentCanvasWidgetId,
                ];
              }
            }
          }
        }
      }
    }

    // Get all children of the MainContainer
    const mainCanvasChildren =
      stateWidgets[MAIN_CONTAINER_WIDGET_ID].children || [];
    // Let's consider the minimum Canvas Height
    // TODO (abhinav): Move this value (100) to WidgetConstants or some other such place
    let maxCanvasHeight = 100;
    // The same logic to compute the minimum height of the MainContainer
    // Based on how many rows are being occuped by children.
    for (const childWidgetId of mainCanvasChildren) {
      if (changesSoFar.hasOwnProperty(childWidgetId)) {
        maxCanvasHeight = Math.max(
          maxCanvasHeight,
          changesSoFar[childWidgetId].bottomRow *
            GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
        );
      } else {
        const childWidget = stateWidgets[childWidgetId];
        maxCanvasHeight = Math.max(
          maxCanvasHeight,
          childWidget.bottomRow * GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
        );
      }
    }

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
      widgetsToUpdate[changedWidgetId] = [
        {
          propertyPath: "bottomRow",
          propertyValue: changesSoFar[changedWidgetId].bottomRow,
        },
        {
          propertyPath: "topRow",
          propertyValue: changesSoFar[changedWidgetId].topRow,
        },
      ];
    }

    log.debug("Dynamic height: Widgets to update:", { widgetsToUpdate });

    // Push all updates to the CanvasWidgetsReducer.
    // Note that we're not calling `UPDATE_LAYOUT`
    // as we don't need to trigger an eval
    yield put({
      type: ReduxActionTypes.UPDATE_MULTIPLE_WIDGET_PROPERTIES,
      payload: widgetsToUpdate,
    });

    log.debug(
      "Dynamic Height: Overall time taken: ",
      performance.now() - start,
      "ms",
    );
  }
}

let dynamicHeightUpdateQueue: any;
const dynamicHeightUpdateWidgets: Record<string, number> = {};
function* batchCallsToUpdateWidgetDynamicHeightSaga(
  action: ReduxAction<UpdateWidgetDynamicHeightPayload>,
) {
  const { height, widgetId } = action.payload;
  dynamicHeightUpdateWidgets[widgetId] = height;
  if (dynamicHeightUpdateQueue) {
    yield cancel(dynamicHeightUpdateQueue);
  }
  // @ts-expect-error: type is any
  dynamicHeightUpdateQueue = yield fork(
    updateWidgetDynamicHeightSaga,
    dynamicHeightUpdateWidgets,
  );
}

function* generateTreeForDynamicHeightComputations(
  action: ReduxAction<{
    shouldCheckContainersForDynamicHeightUpdates: boolean;
  }>,
) {
  const start = performance.now();

  const { canvasLevelMap, occupiedSpaces } = yield select(
    getOccupiedSpacesGroupedByParentCanvas,
  );

  // TODO PERF:(abhinav): Memoize this or something, in case the `UPDATE_LAYOUT` did not cause a change in
  // widget positions and sizes
  let tree: Record<string, TreeNode> = {};
  for (const canvasWidgetId in occupiedSpaces) {
    if (occupiedSpaces[canvasWidgetId].length > 0) {
      const treeForThisCanvas = generateTree(occupiedSpaces[canvasWidgetId]);
      tree = Object.assign({}, tree, treeForThisCanvas);
    }
  }

  yield put(setDynamicHeightLayoutTree(tree, canvasLevelMap));
  const { shouldCheckContainersForDynamicHeightUpdates } = action.payload;

  if (shouldCheckContainersForDynamicHeightUpdates) {
    yield put(checkContainersForDynamicHeightUpdate());
  }
  // TODO IMPLEMENT:(abhinav): Push this analytics to sentry|segment?
  log.debug(
    "Dynamic Height: Tree generation took:",
    performance.now() - start,
    "ms",
  );
}

function* dynamicallyUpdateContainersSaga() {
  const start = performance.now();
  const stateWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
  const canvasWidgets: FlattenedWidgetProps[] | undefined = Object.values(
    stateWidgets,
  ).filter((widget: FlattenedWidgetProps) => widget.type === "CANVAS_WIDGET");
  const canvasLevelMap: CanvasLevelsReduxState = yield select(
    getCanvasLevelMap,
  );

  const groupedByCanvasLevel = groupBy(
    canvasWidgets,
    (widget) => canvasLevelMap[widget.widgetId],
  );

  const levels = Object.keys(groupedByCanvasLevel)
    .map((level) => parseInt(level, 10))
    .sort((a, b) => b - a);

  const updates: Record<string, number> = {};

  for (const level of levels) {
    const canvasWidgetsAtThisLevel = groupedByCanvasLevel[`${level}`];
    for (const canvasWidget of canvasWidgetsAtThisLevel) {
      if (canvasWidget.parentId) {
        const parentContainerWidget = stateWidgets[canvasWidget.parentId];
        if (isDynamicHeightEnabledForWidget(parentContainerWidget)) {
          if (
            Array.isArray(canvasWidget.children) &&
            canvasWidget.children.length > 0
          ) {
            let maxBottomRow = canvasWidget.children.reduce(
              (prev: number, next: string) => {
                if (stateWidgets[next].bottomRow > prev)
                  return stateWidgets[next].bottomRow;
                return prev;
              },
              0,
            );
            maxBottomRow += GridDefaults.CANVAS_EXTENSION_OFFSET;
            // For widgets like Tabs Widget, some of the height is occupied by the
            // tabs themselves, the child canvas as a result has less number of rows available
            // To accommodate for this, we need to increase the new height by the offset amount.
            const canvasHeightOffset: number = yield select(
              getCanvasHeightOffset,
              parentContainerWidget.type,
            );
            maxBottomRow += canvasHeightOffset;

            if (
              maxBottomRow !==
              parentContainerWidget.bottomRow - parentContainerWidget.topRow
            ) {
              if (!updates.hasOwnProperty(parentContainerWidget.widgetId)) {
                updates[parentContainerWidget.widgetId] =
                  maxBottomRow * GridDefaults.DEFAULT_GRID_ROW_HEIGHT;
              }
            }
          }
        }
      }
    }
  }
  log.debug(
    "Dynamic height: Container computations took:",
    performance.now() - start,
    "ms",
  );
  if (Object.keys(updates).length > 0) {
    yield fork(updateWidgetDynamicHeightSaga, updates);
  }
}

export default function* widgetOperationSagas() {
  yield all([
    // TODO: DEBUG(abhinav): Is takeEvery the right way?
    takeEvery(
      ReduxActionTypes.UPDATE_WIDGET_DYNAMIC_HEIGHT,
      batchCallsToUpdateWidgetDynamicHeightSaga,
    ),
    takeLatest(
      [
        ReduxActionTypes.GENERATE_DYNAMIC_HEIGHT_COMPUTATION_TREE, // add, move, paste, cut, delete, undo/redo
        ReduxActionTypes.UPDATE_MULTIPLE_WIDGET_PROPERTIES,
        ReduxActionTypes.INIT_CANVAS_LAYOUT,
      ],
      generateTreeForDynamicHeightComputations,
    ),
    takeLatest(
      ReduxActionTypes.CHECK_CONTAINERS_FOR_DYNAMIC_HEIGHT,
      dynamicallyUpdateContainersSaga,
    ),
  ]);
}
