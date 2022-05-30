import {
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { setDynamicHeightLayoutTree } from "actions/canvasActions";
import { UpdateWidgetDynamicHeightPayload } from "actions/controlActions";
import { OccupiedSpace } from "constants/CanvasEditorConstants";
import {
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import { groupBy } from "lodash";
import log from "loglevel";
import { UpdateWidgetsPayload } from "reducers/entityReducers/canvasWidgetsReducer";
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
import { getCanvasSnapRows } from "utils/WidgetPropsUtils";
import { FlattenedWidgetProps } from "widgets/constants";
import { getWidget } from "./selectors";

// TODO: REFACTOR(abhinav): Move to someplace global, and use it in hooks as well
type PropertyPaths = Array<{
  propertyPath: string;
  propertyValue: any;
}>;
/**
 * Saga to update a widget's dynamic height
 * When a widget changes in height, it must do the following
 * - Make sure any parent that should also change height accordingly, does so
 * - Make sure any widget that needs to reposition due to the above changes, does so
 *
 *
 * TODO: PERF_TRACK(abhinav): Make sure to benchmark the computations. We need to propagate changes within 10ms
 */
//https://marmelab.com/blog/2016/10/18/using-redux-saga-to-deduplicate-and-group-actions.html
export function* updateWidgetDynamicHeightSaga(
  updates: Record<string, number>,
) {
  yield delay(100);
  const start = performance.now();
  console.log("Dynamic height: processing:", { updates });

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
    const widget: FlattenedWidgetProps = yield select(getWidget, widgetId);
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

  console.log("Dynamic height: Expected Changes: ", { expectedUpdates });

  if (expectedUpdates.length > 0) {
    // 1. Get all siblings together.

    const expectedUpdatesGroupedByParent = groupBy(expectedUpdates, "parentId");

    const canvasLevelMap: CanvasLevelsReduxState = yield select(
      getCanvasLevelMap,
    );

    console.log("Dynamic Height: Grouped by parents", {
      expectedUpdatesGroupedByParent,
      canvasLevelMap,
    });
    const dynamicHeightLayoutTree: DynamicHeightLayoutTreeReduxState = yield select(
      getDynamicHeightLayoutTree,
    );

    let changesSoFar: Record<
      string,
      { topRow: number; bottomRow: number }
    > = {};
    for (const parentId in expectedUpdatesGroupedByParent) {
      const delta: Record<string, number> = {};
      expectedUpdatesGroupedByParent[parentId].forEach((expectedUpdate) => {
        delta[expectedUpdate.widgetId] =
          expectedUpdate.expectedChangeInHeightInRows;
      });
      // 2. Run the reflow computations for them

      const siblingWidgetsToUpdate = computeChangeInPositionBasedOnDelta(
        dynamicHeightLayoutTree,
        delta,
      );

      console.log("Dynamic Height: Sibling Widgets To Update:", {
        siblingWidgetsToUpdate,
      });

      changesSoFar = Object.assign(changesSoFar, siblingWidgetsToUpdate);

      let parent: FlattenedWidgetProps = yield select(getWidget, parentId);
      let children: string[] = [];
      while (parent) {
        if (
          parent.type === "CANVAS_WIDGET" &&
          parent.widgetId !== MAIN_CONTAINER_WIDGET_ID
        ) {
          parent = yield select(getWidget, parent.parentId || "");
          children = parent.children || []; // It's never going to be []
        }
        if (parent.dynamicHeight === DynamicHeight.HUG_CONTENTS) {
          // Get the minimum number of rows this parent must have
          let minHeightInRows =
            parent.minDynamicHeight / GridDefaults.DEFAULT_GRID_ROW_HEIGHT;
          for (const childWidgetId in children) {
            if (changesSoFar.hasOwnProperty(childWidgetId)) {
              minHeightInRows = Math.max(
                minHeightInRows,
                changesSoFar[childWidgetId].bottomRow,
              );
            } else {
              const childWidget: FlattenedWidgetProps = yield select(
                getWidget,
                childWidgetId,
              );
              minHeightInRows = Math.max(
                minHeightInRows,
                childWidget.bottomRow,
              );
            }
          }
          // expectedUpdatesGroupedByParent[parent.parentId] = [(...expectedUpdatesGroupedByParent[parent.parentId])]
        }
      }
    }

    console.log("Dynamic Height: Changes So far:", { changesSoFar });

    // const parentDelta: Record<string, number> = {};
    // for (const parentId in expectedUpdatesGroupedByParent) {
    //   const parent: FlattenedWidgetProps = yield select(getWidget, parentId);
    //   if (parent.dynamicHeight === DynamicHeight.FIXED) {
    //     // This parent won't change height based on children
    //   }
    //   const children = parent.children || []; // It's never going to be []

    //   let minHeightInRows =
    //     parent.minDynamicHeight / GridDefaults.DEFAULT_GRID_ROW_HEIGHT;
    //   for (const childWidgetId in children) {
    //     if (changesSoFar.hasOwnProperty(childWidgetId)) {
    //       minHeightInRows = Math.max(
    //         minHeightInRows,
    //         changesSoFar[childWidgetId].bottomRow,
    //       );
    //     } else {
    //       const childWidget: FlattenedWidgetProps = yield select(
    //         getWidget,
    //         childWidgetId,
    //       );
    //       minHeightInRows = Math.max(minHeightInRows, childWidget.bottomRow);
    //     }
    //   }
    //   if (changesSoFar.hasOwnProperty(parentId)) {
    //     parentDelta[parentId] = minBottomRow - parent.bottomRow;
    //     changesSoFar[parentId].bottomRow =
    //       changesSoFar[parentId].topRow + minHeightInRows;
    //   }

    // }

    // 3. Pass all changes to the parent
    // 4. Get all siblings for the parent,
    // 5. get all children of the parent including the ones,
    // for which we've computed new heights, get the max of the bottomRow of the children,
    // then use the same logic as we had earlier to get the new bottomRow of parent.
    // 6. Based on this delta, compute reflow for the parent and siblings or parent
    // 7. Repeact for parent (Step 3)
    // 8. Run the above for all remaining items

    /**** OLD CODE */
    // const { height, widgetId } = updatesArray[0];
    // const widgetsToUpdate: UpdateWidgetsPayload = {};
    // const delta: Record<string, number> = {};
    // // walk up the tree
    // // Club all updates together to put the UPDATE_MULTIPLE_WIDGET_PROPERTIES action

    // const widget: FlattenedWidgetProps = yield select(getWidget, widgetId);
    // const expectedBottomRow =
    //   widget.topRow + Math.ceil(height / widget.parentRowSpace);
    // // When we call this action for the first time, it will not be container like,
    // // It will either be a CanvasWidget, or a non-container widget
    // // If it is a CANVAS WIDGET, we don't really need to do anything
    // // as the canvas widget expands automatically to hug contents.
    // let isContainerLike = false;
    // let updateResult;
    // if (widget.type !== "CANVAS_WIDGET") {
    //   updateResult = getWidgetDynamicHeightUpdates(
    //     widget,
    //     expectedBottomRow,
    //     isContainerLike,
    //   );
    //   if (updateResult.pathsToUpdate) {
    //     widgetsToUpdate[widgetId] = updateResult.pathsToUpdate;
    //     delta[widgetId] =
    //       getHeightDelta(updateResult.pathsToUpdate, widget.bottomRow) || 0;
    //   }
    // } else {
    //   updateResult = {
    //     bottomRow: getCanvasSnapRows(widget.bottomRow, widget.canExtend),
    //   };
    // }

    // let parentId = widget.parentId;

    // while (parentId) {
    //   const parent: FlattenedWidgetProps = yield select(getWidget, parentId);
    //   if (parent.type !== "CANVAS_WIDGET") {
    //     // If the parent is not a CANVAS widget,
    //     // It is going to be a container like widget
    //     isContainerLike = true;
    //     updateResult = getWidgetDynamicHeightUpdates(
    //       parent,
    //       updateResult.bottomRow,
    //       isContainerLike,
    //     );
    //     if (updateResult.pathsToUpdate) {
    //       widgetsToUpdate[parentId] = updateResult.pathsToUpdate;
    //       delta[parentId] =
    //         getHeightDelta(updateResult.pathsToUpdate, widget.bottomRow) || 0;
    //     }
    //   }
    //   parentId = parent.parentId;
    // }
    // // const dynamicHeightLayoutTree: DynamicHeightLayoutTreeReduxState = yield select(
    // //   getDynamicHeightLayoutTree,
    // // );
    // console.log(
    //   "Dynamic height: Layout Tree",
    //   { dynamicHeightLayoutTree },
    //   { delta },
    // );
    // const allWidgetsToUpdate = computeChangeInPositionBasedOnDelta(
    //   dynamicHeightLayoutTree,
    //   delta,
    // );
    // console.log("Dynamic height: Changed positions:", { allWidgetsToUpdate });

    // // for (const widgetId in allWidgetsToUpdate) {
    // //   if (widgetsToUpdate.hasOwnProperty(widgetId)) {
    // //     widgetsToUpdate[widgetId].push(
    // //       {
    // //         propertyPath: "bottomRow",
    // //         propertyValue: allWidgetsToUpdate[widgetId].bottomRow,
    // //       },
    // //       {
    // //         propertyPath: "topRow",
    // //         propertyValue: allWidgetsToUpdate[widgetId].topRow,
    // //       },
    // //     );
    // //   } else {
    // //     widgetsToUpdate[widgetId] = [
    // //       {
    // //         propertyPath: "bottomRow",
    // //         propertyValue: allWidgetsToUpdate[widgetId].bottomRow,
    // //       },
    // //       {
    // //         propertyPath: "topRow",
    // //         propertyValue: allWidgetsToUpdate[widgetId].topRow,
    // //       },
    // //     ];
    // //   }
    // // }

    // /*** EO OLD CODE */
    // console.log("Dynamic height: Widgets to update:", { widgetsToUpdate });
    // yield put({
    //   type: ReduxActionTypes.UPDATE_MULTIPLE_WIDGET_PROPERTIES,
    //   payload: widgetsToUpdate,
    // });
    // log.debug(
    //   "Dynamic Height: Overall time taken: ",
    //   performance.now() - start,
    //   "ms",
    // );
  }
}

function getHeightDelta(
  pathsToUpdate: PropertyPaths,
  originalBottomRow: number,
) {
  console.log(
    "Dynamic height: getting height delta",
    { pathsToUpdate },
    { originalBottomRow },
  );
  const bottomRowProperty = pathsToUpdate.find(
    (path) => path.propertyPath === "bottomRow",
  );
  if (!bottomRowProperty) return;
  return bottomRowProperty.propertyValue - originalBottomRow;
}

// TODO: REFACTOR(abhinav): Move to WidgetOperationUtils
function getWidgetDynamicHeightUpdates(
  widget: FlattenedWidgetProps,
  expectedBottomRow: number, // This is bottomRow for non-containerLike, and child's bottomRow for containerLike
  isContainerLike: boolean,
): { bottomRow: number; pathsToUpdate?: PropertyPaths } {
  // TODO: DEBUG(abhinav): Make sure parentRowSpace exists

  // If dynamic height isn't enabled, don't update anything
  const isDynamicHeightEnabled =
    widget.dynamicHeight === DynamicHeight.HUG_CONTENTS;

  if (!isDynamicHeightEnabled) return { bottomRow: widget.bottomRow };

  const { maxDynamicHeight, minDynamicHeight } = widget;

  // If this is not a container like widget
  // This means, we have to change the height of the current widget
  // And that expectedBottomRow, is the expected bottomRow of the current widget

  // Fun fact, a majority of the computations are going to be in pixels
  if (!isContainerLike) {
    // The current widget height in pixels
    const currentHeightInPixels: number =
      (widget.bottomRow - widget.topRow) * widget.parentRowSpace;

    // The expected height of "this" widget in pixels
    const expectedHeightInPixels: number =
      (expectedBottomRow - widget.topRow) * widget.parentRowSpace;

    let newHeightInPixels = currentHeightInPixels;

    // If the expected height is smaller than the current height
    // We need to make sure that we're not already at the minimum height
    if (
      expectedHeightInPixels < currentHeightInPixels &&
      currentHeightInPixels > minDynamicHeight
    ) {
      // If we're not at the minimum height --
      // We take the max between minimum height and expected height (both in pixels)
      newHeightInPixels = Math.max(minDynamicHeight, expectedHeightInPixels);
    }

    // If the expected height is larger than the current height
    // We need to make sure that we're not already at the maximum height
    if (
      expectedHeightInPixels > currentHeightInPixels &&
      currentHeightInPixels < maxDynamicHeight
    ) {
      // If we're not at the maximum height --
      // We take the min between maximum height and expected height (both in pixels)
      newHeightInPixels = Math.min(maxDynamicHeight, expectedHeightInPixels);
    }

    // Convert the height to a bottomRow value
    const newBottomRow =
      widget.topRow + Math.ceil(newHeightInPixels / widget.parentRowSpace);

    return {
      bottomRow: newBottomRow,
      pathsToUpdate: [
        {
          propertyPath: "bottomRow",
          propertyValue: newBottomRow,
        },
      ],
    };
  }
  // If this is a container like widget
  // This means, we have to change the height of the current widget
  // to accommodate the child's increase or decrese in height
  // And that expectedBottomRow, is actually the new bottomRow of the child widget

  // Fun fact, a majorify of the computations are going to be in rows
  else {
    // Number of rows possible for any child in this widget without scrolling
    const numberOfRows: number = widget.bottomRow - widget.topRow;

    let newBottomRow = widget.bottomRow;

    // If the child's bottom row is smaller than the available rows in this widget
    // We need to make sure that we're not already at the minimum height
    if (
      numberOfRows > expectedBottomRow &&
      numberOfRows * GridDefaults.DEFAULT_GRID_ROW_HEIGHT > minDynamicHeight
    ) {
      // If we're not at the minimum height --
      // We take the max between minimum height and child's bottomRow (both in rows)
      // and add it to the topRow, to get the new bottomRow
      newBottomRow =
        Math.max(
          minDynamicHeight / GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
          expectedBottomRow,
        ) + widget.topRow;
    }

    // If the child's bottom row is larger than the available rows in this widget
    // We need to make sure that we're not already at the maximum height
    if (
      numberOfRows < expectedBottomRow &&
      numberOfRows * GridDefaults.DEFAULT_GRID_ROW_HEIGHT < maxDynamicHeight
    ) {
      // If we're not at the maximum height --
      // We take the min between maximum height and child's bottomRow (both in rows)
      // and add it to the topRow, to get the new bottomRow
      newBottomRow =
        Math.min(
          maxDynamicHeight / GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
          expectedBottomRow,
        ) + widget.topRow;
    }

    console.log(
      "Dynamic height: parent container to update: ",
      { numberOfRows },
      { expectedBottomRow },
      { newBottomRow },
      { maxDynamicHeight },
      { minDynamicHeight },
      { widget },
    );
    return {
      bottomRow: newBottomRow,
      pathsToUpdate: [
        {
          propertyPath: "bottomRow",
          propertyValue: newBottomRow,
        },
      ],
    };
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

  //   if (!dynamicHeightUpdateWidgets[widgetId])
  //     if (!dynamicHeightUpdateWidgets[widgetId]) {
  //       dynamicHeightUpdateWidgets[widgetId] = {};
  //     }
  //   //   dynamicHeightUpdateWidgets[widgetId][id] = true; // fast UNIQUE
  //   if (dynamicHeightUpdateWidgets[widgetId]) {
  //     yield cancel(tasks[resource]);
  //   }
  //   tasks[resource] = yield fork(updateWidgetDynamicHeightSaga, resource);
}

function* generateTreeForDynamicHeightComputations() {
  const start = performance.now();
  const { canvasLevelMap, occupiedSpaces } = yield select(
    getOccupiedSpacesGroupedByParentCanvas,
  );

  // TODO PERF:(abhinav): Memoize this or something, in case the `UPDATE_LAYOUT` did not cause a change in
  // widget positions and sizes
  let tree: Record<string, TreeNode> = {};
  for (const canvasWidgetId in occupiedSpaces) {
    if (occupiedSpaces[canvasWidgetId].length > 0)
      tree = Object.assign(
        {},
        tree,
        generateTree(occupiedSpaces[canvasWidgetId]),
      );
  }

  yield put(setDynamicHeightLayoutTree(tree, canvasLevelMap));
  console.log("Dynamic height: Layout Tree", { tree });
  // TODO IMPLEMENT:(abhinav): Push this analytics to sentry|segment?
  log.debug(
    "Dynamic Height: Tree generation took:",
    performance.now() - start,
    "ms",
  );
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
        ReduxActionTypes.UPDATE_LAYOUT,
        ReduxActionTypes.UPDATE_MULTIPLE_WIDGET_PROPERTIES,
        ReduxActionTypes.INIT_CANVAS_LAYOUT,
      ],
      generateTreeForDynamicHeightComputations,
    ),
  ]);
}
