import {
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { UpdateWidgetDynamicHeightPayload } from "actions/controlActions";
import { updateMultipleWidgetProperties } from "actions/widgetActions";
import {
  CANVAS_MIN_HEIGHT,
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import { groupBy, uniq } from "lodash";
import log from "loglevel";
import {
  CanvasWidgetsReduxState,
  UpdateWidgetsPayload,
} from "reducers/entityReducers/canvasWidgetsReducer";
import {
  all,
  put,
  select,
  takeEvery,
  takeLatest,
  debounce,
} from "redux-saga/effects";
import {
  getCanvasHeightOffset,
  getOccupiedSpacesGroupedByParentCanvas,
  previewModeSelector,
} from "selectors/editorSelectors";
import {
  getCanvasLevelMap,
  getAutoHeightLayoutTree,
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
import { getWidgetMetaProps, getWidgets } from "./selectors";
import { getAppMode } from "selectors/entitiesSelector";
import { APP_MODE } from "entities/App";
import { getIsDraggingOrResizing } from "selectors/widgetSelectors";
import {
  checkContainersForAutoHeightAction,
  generateAutoHeightLayoutTreeAction,
  setAutoHeightLayoutTreeAction,
} from "actions/autoHeightActions";
import { AutoHeightLayoutTreeReduxState } from "reducers/entityReducers/autoHeightReducers/autoHeightLayoutTreeReducer";
import { CanvasLevelsReduxState } from "reducers/entityReducers/autoHeightReducers/canvasLevelsReducer";

export function* getMinHeightBasedOnChildren(
  widgetId: string,
  changesSoFar: Record<string, { bottomRow: number; topRow: number }>,
) {
  let minHeightInRows = 0;
  const shouldCollapse: boolean = yield shouldWidgetsCollapse();
  const stateWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
  const dynamicHeightLayoutTree: AutoHeightLayoutTreeReduxState = yield select(
    getAutoHeightLayoutTree,
  );
  const { children = [] } = stateWidgets[widgetId];
  // For each child widget id.
  for (const childWidgetId of children) {
    // If we've changed the widget's bottomRow via computations
    const { detachFromLayout } = stateWidgets[childWidgetId];
    // We ignore widgets like ModalWidget which don't occupy parent's space.
    // detachFromLayout helps us identify such widgets
    if (detachFromLayout) continue;
    const { bottomRow, topRow } = dynamicHeightLayoutTree[childWidgetId];

    if (changesSoFar.hasOwnProperty(childWidgetId)) {
      const collapsing =
        changesSoFar[childWidgetId].bottomRow ===
        changesSoFar[childWidgetId].topRow;

      if (!(shouldCollapse && collapsing))
        minHeightInRows = Math.max(
          minHeightInRows,
          changesSoFar[childWidgetId].bottomRow,
        );
      // If we need to get the existing bottomRow from the state
    } else {
      if (!(shouldCollapse && bottomRow === topRow))
        minHeightInRows = Math.max(minHeightInRows, bottomRow);
    }
  }
  return minHeightInRows;
}

export function* getChildOfContainerLikeWidget(
  containerLikeWidget: FlattenedWidgetProps,
) {
  // Todo: Abstraction leak (abhinav): This is an abstraction leak
  // I don't have a better solution right now.
  // What we're trying to acheive is to skip the canvas which
  // is not currently visible in the tabs widget.
  if (containerLikeWidget.type === "TABS_WIDGET") {
    const tabsMeta: { selectedTabWidgetId: string } | undefined = yield select(
      getWidgetMetaProps,
      containerLikeWidget.widgetId,
    );
    if (tabsMeta) return tabsMeta.selectedTabWidgetId;

    const firstTab = Object.values(
      containerLikeWidget.tabsObj as Record<
        string,
        { widgetId: string; index: number }
      >,
    ).find((entry: { widgetId: string; index: number }) => entry.index === 0);

    return firstTab?.widgetId;
  } else if (Array.isArray(containerLikeWidget.children)) {
    return containerLikeWidget.children[0];
  }
}

export function* shouldWidgetsCollapse() {
  const isPreviewMode: boolean = yield select(previewModeSelector);
  const appMode: APP_MODE = yield select(getAppMode);

  return isPreviewMode || appMode === APP_MODE.PUBLISHED;
}

/**
 * Saga to update a widget's dynamic height
 * When a widget changes in height, it must do the following
 * - Make sure any parent that should also change height accordingly, does so
 * - Make sure any widget that needs to reposition due to the above changes, does so
 *
 *
 * TODO: PERF_TRACK(abhinav): Make sure to benchmark the computations. We need to propagate changes within 10ms
 */
export function* updateWidgetDynamicHeightSaga() {
  const updates = dynamicHeightUpdateWidgets;
  const start = performance.now();

  log.debug(
    "Dynamic height: Computing debounced: ",
    { updates },
    { timeStamp: performance.now() },
  );

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

  const shouldCollapse: boolean = yield shouldWidgetsCollapse();

  // For each widget which have new heights to update.
  for (const widgetId in updates) {
    // Get the widget from the reducer.
    const widget: FlattenedWidgetProps = stateWidgets[widgetId];
    // If this widget exists (not sure why this needs to be here)
    if (widget && !widget.detachFromLayout) {
      // Get the boundaries for possible min and max dynamic height.
      let minDynamicHeightInPixels =
        getWidgetMinDynamicHeight(widget) *
        GridDefaults.DEFAULT_GRID_ROW_HEIGHT;

      // In case of a widget going invisible in view mode
      if (updates[widgetId] === 0) {
        if (shouldCollapse && isDynamicHeightEnabledForWidget(widget)) {
          minDynamicHeightInPixels = 0;
        } else continue;
      }

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

      const expectedHeightInRows = Math.ceil(
        newHeightInPixels / GridDefaults.DEFAULT_GRID_ROW_HEIGHT -
          (widget.bottomRow - widget.topRow),
      );

      // if(shouldCollapse && isDynamicHeightEnabledForWidget(widget) && M)
      // if (
      //   shouldCollapse &&
      //   isDynamicHeightEnabledForWidget(widget) &&
      //   Math.abs(expectedHeightInRows) === 0
      // ) {
      //   expectedHeightInRows = -(
      //     widget.originalBottomRow - widget.originalTopRow
      //   );
      // }
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

    // const expectedUpdatesGroupedByParentCanvasWidget: Record<
    //   string,
    //   unknown[]
    // > = {};
    // for (const expectedUpdate of expectedUpdates) {
    //   if (expectedUpdate.parentId) {
    //     expectedUpdatesGroupedByParentCanvasWidget[
    //       `${expectedUpdate.parentId}`
    //     ] = [
    //       ...(expectedUpdatesGroupedByParentCanvasWidget[
    //         expectedUpdate.parentId
    //       ] || []),
    //       expectedUpdate,
    //     ];
    //   }
    // }

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

    // Get the tree data structure we will be using to compute updates
    const dynamicHeightLayoutTree: AutoHeightLayoutTreeReduxState = yield select(
      getAutoHeightLayoutTree,
    );

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

      // log.debug(
      //   "Dynamic height considering: ",
      //   { level },
      //   { parentCanvasWidgetsToConsider },
      //   { expectedUpdatesGroupedByParentCanvasWidget },
      //   { parentCanvasWidgetsGroupedByLevel },
      // );

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

        log.debug("Dynamic height: Computing sibling updates:", {
          siblingWidgetsToUpdate,
          dynamicHeightLayoutTree,
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
            if (isDynamicHeightEnabledForWidget(parentContainerLikeWidget)) {
              // Get the minimum number of rows this parent must have

              let minHeightInRows = getWidgetMinDynamicHeight(
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
              const maxDynamicHeight = getWidgetMaxDynamicHeight(
                parentContainerLikeWidget,
              );

              minHeightInRows = Math.min(maxDynamicHeight, minHeightInRows);

              // log.debug("Dynamic height, updating parent:", {
              //   parentContainerLikeWidget,
              //   canvasHeightOffset,
              //   minHeightInRows,
              //   maxBottomRow,
              //   maxDynamicHeight,
              // });

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

              // log.debug("Dynamic height parent container like widget:", {
              //   parentContainerLikeWidget,
              //   type: parentContainerLikeWidget.type,
              // });

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
                // log.debug("Dynamic height: Adding parent update", {
                //   parentContainerLikeWidget,
                //   expectedUpdate,
                // });
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
    let maxCanvasHeight = CANVAS_MIN_HEIGHT;
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
    dynamicHeightUpdateWidgets = {};
    yield put(generateAutoHeightLayoutTreeAction(false, false));
  }

  log.debug(
    "Dynamic Height: Overall time taken: ",
    performance.now() - start,
    "ms",
  );
}

let dynamicHeightUpdateWidgets: Record<string, number> = {};
function* batchCallsToUpdateWidgetDynamicHeightSaga(
  action: ReduxAction<UpdateWidgetDynamicHeightPayload>,
) {
  const isLayoutUpdating: boolean = yield select(getIsDraggingOrResizing);
  const { height, widgetId } = action.payload;
  log.debug("Dynamic height: batching update:", { widgetId, height });

  if (dynamicHeightUpdateWidgets[widgetId] !== height) {
    dynamicHeightUpdateWidgets[widgetId] = height;
    if (isLayoutUpdating) return;
    yield put({
      type: ReduxActionTypes.PROCESS_AUTO_HEIGHT_UPDATES,
      payload: dynamicHeightUpdateWidgets,
    });
  }
}

function* generateTreeForDynamicHeightComputations(
  action: ReduxAction<{
    shouldCheckContainersForDynamicHeightUpdates: boolean;
    layoutUpdated: boolean;
  }>,
) {
  const start = performance.now();

  const shouldCollapse: boolean = yield shouldWidgetsCollapse();
  const { canvasLevelMap, occupiedSpaces } = yield select(
    getOccupiedSpacesGroupedByParentCanvas,
  );

  // TODO PERF:(abhinav): Memoize this or something, in case the `UPDATE_LAYOUT` did not cause a change in
  // widget positions and sizes
  let tree: Record<string, TreeNode> = {};
  const previousTree: Record<string, TreeNode> = yield select(
    getAutoHeightLayoutTree,
  );
  for (const canvasWidgetId in occupiedSpaces) {
    if (occupiedSpaces[canvasWidgetId].length > 0) {
      const treeForThisCanvas = generateTree(
        occupiedSpaces[canvasWidgetId],
        !shouldCollapse && action.payload.layoutUpdated,
        previousTree,
      );
      tree = Object.assign({}, tree, treeForThisCanvas);
    }
  }

  yield put(setAutoHeightLayoutTreeAction(tree, canvasLevelMap));
  const { shouldCheckContainersForDynamicHeightUpdates } = action.payload;

  if (shouldCheckContainersForDynamicHeightUpdates) {
    yield put({
      type: ReduxActionTypes.PROCESS_AUTO_HEIGHT_UPDATES,
      payload: dynamicHeightUpdateWidgets,
    });
    yield put(checkContainersForAutoHeightAction());
  }
  // TODO IMPLEMENT:(abhinav): Push this analytics to sentry|segment?
  log.debug(
    "Dynamic Height: Tree generation took:",
    performance.now() - start,
    "ms",
  );
}

export function* dynamicallyUpdateContainersSaga() {
  const start = performance.now();

  const stateWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
  const canvasWidgets: FlattenedWidgetProps[] | undefined = Object.values(
    stateWidgets,
  ).filter((widget: FlattenedWidgetProps) => widget.type === "CANVAS_WIDGET");
  const canvasLevelMap: CanvasLevelsReduxState = yield select(
    getCanvasLevelMap,
  );

  const dynamicHeightLayoutTree: AutoHeightLayoutTreeReduxState = yield select(
    getAutoHeightLayoutTree,
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

        let bottomRow, topRow;
        if (dynamicHeightLayoutTree[parentContainerWidget.widgetId]) {
          const layoutNode =
            dynamicHeightLayoutTree[parentContainerWidget.widgetId];
          bottomRow = layoutNode.bottomRow;
          topRow = layoutNode.topRow;
        } else {
          bottomRow = parentContainerWidget.bottomRow;
          topRow = parentContainerWidget.topRow;
        }
        if (isDynamicHeightEnabledForWidget(parentContainerWidget)) {
          const childWidgetId:
            | string
            | undefined = yield getChildOfContainerLikeWidget(
            parentContainerWidget,
          );
          if (childWidgetId !== canvasWidget.widgetId) continue;

          let maxBottomRow = bottomRow - topRow;
          if (
            parentContainerWidget.detachFromLayout &&
            parentContainerWidget.height
          ) {
            maxBottomRow =
              parentContainerWidget.height /
              GridDefaults.DEFAULT_GRID_ROW_HEIGHT;
          }

          if (
            Array.isArray(canvasWidget.children) &&
            canvasWidget.children.length > 0
          ) {
            maxBottomRow = canvasWidget.children
              .filter((widgetId) => !stateWidgets[widgetId].detachFromLayout)
              .reduce((prev: number, next: string) => {
                if (dynamicHeightLayoutTree[next].bottomRow > prev)
                  return dynamicHeightLayoutTree[next].bottomRow;
                return prev;
              }, 0);
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
          // Get the boundaries for possible min and max dynamic height.
          const minDynamicHeightInRows = getWidgetMinDynamicHeight(
            parentContainerWidget,
          );
          const maxDynamicHeightInRows = getWidgetMaxDynamicHeight(
            parentContainerWidget,
          );

          // If the new height is below the min threshold
          if (maxBottomRow < minDynamicHeightInRows) {
            maxBottomRow = minDynamicHeightInRows;
          }
          // If the new height is above the max threshold
          if (maxBottomRow > maxDynamicHeightInRows) {
            maxBottomRow = maxDynamicHeightInRows;
          }

          if (maxBottomRow !== bottomRow - topRow) {
            if (!updates.hasOwnProperty(parentContainerWidget.widgetId)) {
              updates[parentContainerWidget.widgetId] =
                maxBottomRow * GridDefaults.DEFAULT_GRID_ROW_HEIGHT;
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
  log.debug("Dynamic height: Container updates:", { updates });
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
}

export default function* widgetOperationSagas() {
  yield all([
    // TODO: DEBUG(abhinav): Is takeEvery the right way?
    takeEvery(
      ReduxActionTypes.UPDATE_WIDGET_AUTO_HEIGHT,
      batchCallsToUpdateWidgetDynamicHeightSaga,
    ),
    debounce(
      100,
      ReduxActionTypes.PROCESS_AUTO_HEIGHT_UPDATES,
      updateWidgetDynamicHeightSaga,
    ),
    takeLatest(
      [
        ReduxActionTypes.GENERATE_AUTO_HEIGHT_LAYOUT_TREE, // add, move, paste, cut, delete, undo/redo
      ],
      generateTreeForDynamicHeightComputations,
    ),
    takeLatest(
      ReduxActionTypes.CHECK_CONTAINERS_FOR_AUTO_HEIGHT,
      dynamicallyUpdateContainersSaga,
    ),
  ]);
}
