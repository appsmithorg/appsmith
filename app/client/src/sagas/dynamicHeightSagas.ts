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
import { getOccupiedSpacesGroupedByParentCanvas } from "selectors/editorSelectors";
import {
  getCanvasLevelMap,
  getDynamicHeightLayoutTree,
} from "selectors/widgetReflowSelectors";
import {
  computeChangeInPositionBasedOnDelta,
  generateTree,
  TreeNode,
} from "utils/treeManipulationHelpers/dynamicHeightReflow";
import { DynamicHeight } from "utils/WidgetFeatures";
import { FlattenedWidgetProps } from "widgets/constants";
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
  yield delay(50);
  const start = performance.now();

  log.debug("Dynamic height: Call for updates: ", { updates });
  const stateWidgets: CanvasWidgetsReduxState = yield select(getWidgets);

  const expectedUpdates: Array<{
    widgetId: string;
    expectedHeightinPx: number;
    expectedChangeInHeightInRows: number;
    currentTopRow: number;
    currentBottomRow: number;
    expectedBottomRow: number;
    parentId?: string;
  }> = [];
  for (const widgetId in updates) {
    const widget: FlattenedWidgetProps = stateWidgets[widgetId];
    expectedUpdates.push({
      widgetId,
      expectedHeightinPx: updates[widgetId],
      expectedChangeInHeightInRows:
        updates[widgetId] / GridDefaults.DEFAULT_GRID_ROW_HEIGHT -
        (widget.bottomRow - widget.topRow),
      currentTopRow: widget.topRow,
      currentBottomRow: widget.bottomRow,
      expectedBottomRow:
        widget.topRow +
        updates[widgetId] / GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
      parentId: widget.parentId,
    });
  }

  if (expectedUpdates.length > 0) {
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

    const parentCanvasWidgetsGroupedByLevel: { [level: string]: string[] } = {
      "0": [MAIN_CONTAINER_WIDGET_ID],
    };
    let maxLevel = 0;
    // TODO (abhinav): So far it seems like expectedUpdatesGroupedByParent is only used here
    // If this turns out to be case, remove this variable and compute directly from expetedUpdates
    for (const parentCanvasWidgetId in expectedUpdatesGroupedByParentCanvasWidget) {
      const _level = canvasLevelMap[parentCanvasWidgetId];

      if (_level > maxLevel) maxLevel = _level;
      parentCanvasWidgetsGroupedByLevel[_level] = [
        ...(parentCanvasWidgetsGroupedByLevel[_level] || []),
        parentCanvasWidgetId,
      ];
    }

    const parentCanvasWidgetsForWhomChildUpdatesHaveBeenComputed = [];
    const dynamicHeightLayoutTree: DynamicHeightLayoutTreeReduxState = yield select(
      getDynamicHeightLayoutTree,
    );

    let changesSoFar: Record<
      string,
      { topRow: number; bottomRow: number }
    > = {};

    // start with the bottom most level (maxLevel)
    for (let level = maxLevel; level >= 0; level--) {
      const parentCanvasWidgetsToConsider =
        parentCanvasWidgetsGroupedByLevel[level];
      const delta: Record<string, number> = {};

      parentCanvasWidgetsToConsider.forEach((parentCanvasWidgetId) => {
        parentCanvasWidgetsForWhomChildUpdatesHaveBeenComputed.push(
          parentCanvasWidgetId,
        );
        expectedUpdatesGroupedByParentCanvasWidget[
          parentCanvasWidgetId
        ].forEach((expectedUpdate) => {
          delta[expectedUpdate.widgetId] =
            expectedUpdate.expectedChangeInHeightInRows;
        });
      });

      // 2. Run the reflow computations for them

      const siblingWidgetsToUpdate = computeChangeInPositionBasedOnDelta(
        dynamicHeightLayoutTree,
        delta,
      );

      changesSoFar = Object.assign(changesSoFar, siblingWidgetsToUpdate);
      for (const parentCanvasWidgetId of parentCanvasWidgetsToConsider) {
        const parentCanvasWidget: FlattenedWidgetProps =
          stateWidgets[parentCanvasWidgetId];
        if (parentCanvasWidget.parentId) {
          const parentContainerLikeWidget: FlattenedWidgetProps =
            stateWidgets[parentCanvasWidget.parentId];
          if (
            parentContainerLikeWidget.dynamicHeight ===
            DynamicHeight.HUG_CONTENTS
          ) {
            // Get the minimum number of rows this parent must have
            let minHeightInRows = parentContainerLikeWidget.minDynamicHeight;
            const children = parentCanvasWidget.children || []; // It's never going to be []
            for (const childWidgetId of children) {
              if (changesSoFar.hasOwnProperty(childWidgetId)) {
                minHeightInRows = Math.max(
                  minHeightInRows,
                  changesSoFar[childWidgetId].bottomRow,
                );
              } else {
                const childWidget: FlattenedWidgetProps =
                  stateWidgets[childWidgetId];

                if (!childWidget.detachFromLayout) {
                  minHeightInRows = Math.max(
                    minHeightInRows,
                    childWidget.bottomRow,
                  );
                }
              }
            }

            minHeightInRows =
              minHeightInRows + GridDefaults.CANVAS_EXTENSION_OFFSET;

            if (parentContainerLikeWidget.maxDynamicHeight > 0)
              minHeightInRows = Math.min(
                parentContainerLikeWidget.maxDynamicHeight || 10000,
                minHeightInRows,
              );

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

            if (parentContainerLikeWidget.parentId) {
              if (
                expectedUpdatesGroupedByParentCanvasWidget.hasOwnProperty(
                  parentContainerLikeWidget.parentId,
                )
              ) {
                expectedUpdatesGroupedByParentCanvasWidget[
                  parentContainerLikeWidget.parentId
                ].push(expectedUpdate);
              } else {
                expectedUpdatesGroupedByParentCanvasWidget[
                  parentContainerLikeWidget.parentId
                ] = [expectedUpdate];
              }
              const _level = canvasLevelMap[parentContainerLikeWidget.parentId];
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

    const mainCanvasChildren =
      stateWidgets[MAIN_CONTAINER_WIDGET_ID].children || [];
    let maxCanvasHeight = 100;
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

    const widgetsToUpdate: UpdateWidgetsPayload = {};
    widgetsToUpdate[MAIN_CONTAINER_WIDGET_ID] = [
      {
        propertyPath: "bottomRow",
        propertyValue:
          maxCanvasHeight +
          GridDefaults.CANVAS_EXTENSION_OFFSET *
            GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
      },
    ];
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
        if (
          parentContainerWidget.dynamicHeight === DynamicHeight.HUG_CONTENTS
        ) {
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
