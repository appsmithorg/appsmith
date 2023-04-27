import type {
  CanvasWidgetsReduxState,
  FlattenedWidgetProps,
  UpdateWidgetsPayload,
} from "reducers/entityReducers/canvasWidgetsReducer";
import { call, put, select } from "redux-saga/effects";
import {
  alterLayoutForDesktop,
  alterLayoutForMobile,
  getCanvasDimensions,
} from "utils/autoLayout/AutoLayoutUtils";
import { getCanvasAndMetaWidgets, getWidgets } from "../selectors";
import type { DefaultDimensionMap } from "constants/WidgetConstants";
import {
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
  WidgetHeightLimits,
} from "constants/WidgetConstants";
import {
  addWidgetDimensionProxy,
  getIsAutoLayout,
  getIsAutoLayoutMobileBreakPoint,
} from "selectors/editorSelectors";
import { getCanvasWidth as getMainCanvasWidth } from "selectors/editorSelectors";
import {
  getLeftColumn,
  getTopRow,
  getWidgetMinMaxDimensionsInPixel,
  setBottomRow,
  setRightColumn,
} from "utils/autoLayout/flexWidgetUtils";
import { isEmpty } from "lodash";
import { getIsCurrentlyConvertingLayout } from "selectors/autoLayoutSelectors";
import {
  getChildOfContainerLikeWidget,
  mutation_setPropertiesToUpdate,
  shouldWidgetsCollapse,
} from "sagas/autoHeightSagas/helpers";
import { getDataTree } from "selectors/dataTreeSelectors";
import type { DataTree, WidgetEntity } from "entities/DataTree/dataTreeFactory";
import { getCanvasHeightOffset } from "utils/WidgetSizeUtils";
import log from "loglevel";
import { APP_MODE } from "entities/App";
import { CANVAS_DEFAULT_MIN_HEIGHT_PX } from "constants/AppConstants";
import { getAppMode } from "selectors/entitiesSelector";
import { MOBILE_ROW_GAP, ROW_GAP } from "utils/autoLayout/constants";
import { updateWidgetPositions } from "utils/autoLayout/positionUtils";
import { updateMultipleWidgetPropertiesAction } from "actions/controlActions";

export function* recalculatePositionsOfWidgets({
  canvasWidth,
  isMobile,
  parentId,
  widgets: payloadWidgets,
}: {
  parentId: string;
  isMobile: boolean;
  canvasWidth: number;
  widgets?: CanvasWidgetsReduxState;
}) {
  const isAutoLayout: boolean = yield select(getIsAutoLayout);
  if (!isAutoLayout) return;
  //Do not recalculate columns and update layout while converting layout
  const isCurrentlyConvertingLayout: boolean = yield select(
    getIsCurrentlyConvertingLayout,
  );
  if (isCurrentlyConvertingLayout) return;

  let allWidgets: CanvasWidgetsReduxState;
  const widgetsOld: CanvasWidgetsReduxState = yield select(getWidgets);

  if (payloadWidgets) {
    allWidgets = payloadWidgets;
  } else {
    allWidgets = { ...widgetsOld };
  }

  const mainCanvasWidth: number = yield select(getMainCanvasWidth);
  const processedWidgets: CanvasWidgetsReduxState = isMobile
    ? alterLayoutForMobile(allWidgets, parentId, canvasWidth, mainCanvasWidth)
    : alterLayoutForDesktop(allWidgets, parentId, mainCanvasWidth);
  // const dimensionMap: typeof DefaultDimensionMap = yield select(
  //   getDimensionMap,
  // );
  // processedWidgets = yield call(
  //   getUpdatesOfAllAutoLayoutCanvasHeight,
  //   processedWidgets,
  //   dimensionMap,
  //   mainCanvasWidth,
  //   isMobile,
  // );
  return processedWidgets;
}
const positionProperties = [
  "topRow",
  "bottomRow",
  "leftColumn",
  "rightColumn",
  "mobileTopRow",
  "mobileBottomRow",
  "mobileLeftColumn",
  "mobileRightColumn",
];
const modalDimensionProperties = ["height"];

const dimensionPropertiesToConsider = [
  ...positionProperties,
  ...modalDimensionProperties,
];

export function* getWidgetsWithDimensionChanges(
  processedWidgets: CanvasWidgetsReduxState,
) {
  const widgetsOld: CanvasWidgetsReduxState = yield select(
    getCanvasAndMetaWidgets,
  );
  let widgetsToUpdate: UpdateWidgetsPayload = {};
  /**
   * Iterate over all widgets and check if any of their dimensions have changed
   * If they have, add them to the list of widgets to update
   * Note: We need to iterate through all widgets since changing dimension of one widget might affect the dimensions of other widgets
   */
  for (const widgetId of Object.keys(processedWidgets)) {
    const widget = processedWidgets[widgetId];
    const oldWidget = widgetsOld[widgetId];
    const propertiesToUpdate: Record<string, any> = {};

    for (const prop of dimensionPropertiesToConsider) {
      if (widget[prop] !== oldWidget[prop]) {
        propertiesToUpdate[prop] = widget[prop];
      }
    }

    if (isEmpty(propertiesToUpdate)) continue;

    widgetsToUpdate = mutation_setPropertiesToUpdate(
      widgetsToUpdate,
      widgetId,
      propertiesToUpdate,
    );
  }
  return widgetsToUpdate;
}

let autoLayoutWidgetDimensionUpdateBatch: Record<
  string,
  { width: number; height: number }
> = {};

export function batchWidgetDimensionsUpdateForAutoLayout(
  widgetId: string,
  width: number,
  height: number,
) {
  autoLayoutWidgetDimensionUpdateBatch[widgetId] = { width, height };
}

export function* processAutoLayoutDimensionUpdatesFn(
  allWidgets: CanvasWidgetsReduxState,
  parentIds: Set<string>,
  isMobile: boolean,
  mainCanvasWidth: number,
) {
  if (Object.keys(autoLayoutWidgetDimensionUpdateBatch).length === 0) {
    return allWidgets;
  }
  // Iterate through the batch and update the new dimensions
  let widgets = { ...allWidgets };
  for (const widgetId in autoLayoutWidgetDimensionUpdateBatch) {
    const { height, width } = autoLayoutWidgetDimensionUpdateBatch[widgetId];
    const widget = allWidgets[widgetId];
    if (!widget) continue;
    const parentId = widget.parentId;
    if (parentId === undefined) continue;
    if (parentId) parentIds.add(parentId);

    const { columnSpace } = getCanvasDimensions(
      widgets[parentId],
      widgets,
      mainCanvasWidth,
      isMobile,
    );

    //get row space
    const rowSpace = widget.detachFromLayout
      ? 1
      : GridDefaults.DEFAULT_GRID_ROW_HEIGHT;

    let widgetToBeUpdated = { ...widget };

    widgetToBeUpdated = setBottomRow(
      widgetToBeUpdated,
      getTopRow(widget, isMobile) + height / rowSpace,
      isMobile,
    );

    widgetToBeUpdated = setRightColumn(
      widgetToBeUpdated,
      getLeftColumn(widget, isMobile) + width / columnSpace,
      isMobile,
    );

    widgets = {
      ...widgets,
      [widgetId]: widgetToBeUpdated,
    };
  }

  return widgets;
}

export function* processWidgetDimensionsSaga() {
  const allWidgets: CanvasWidgetsReduxState = yield select(
    getCanvasAndMetaWidgets,
  );
  const mainCanvasWidth: number = yield select(getMainCanvasWidth);
  const isMobile: boolean = yield select(getIsAutoLayoutMobileBreakPoint);

  const parentIds = new Set<string>();
  let processedWidgets: CanvasWidgetsReduxState = yield call(
    processAutoLayoutDimensionUpdatesFn,
    allWidgets,
    parentIds,
    isMobile,
    mainCanvasWidth,
  );

  // Update the position of all the widgets
  for (const parentId of parentIds) {
    processedWidgets = updateWidgetPositions(
      processedWidgets,
      parentId,
      isMobile,
      mainCanvasWidth,
    );
  }

  // Gets only the widgets that need to be updated
  yield call(getWidgetsWithDimensionChanges, processedWidgets);
  const widgetsToUpdate: UpdateWidgetsPayload = yield call(
    getWidgetsWithDimensionChanges,
    processedWidgets,
  );

  // Push all updates to the CanvasWidgetsReducer.
  // Note that we're not calling `UPDATE_LAYOUT`
  // as we don't need to trigger an eval
  if (!isEmpty(widgetsToUpdate)) {
    yield put(updateMultipleWidgetPropertiesAction(widgetsToUpdate));
  }

  // clear the batch after processing
  autoLayoutWidgetDimensionUpdateBatch = {};
}

export function* getAutoLayoutMinHeightBasedOnChildren(
  widgetId: string,
  dimensionMap: typeof DefaultDimensionMap,
  changesSoFar: Record<string, { bottomRow: number; topRow: number }>,
  widgets: CanvasWidgetsReduxState,
  isMobile: boolean,
) {
  const rowGap =
    (isMobile ? MOBILE_ROW_GAP : ROW_GAP) /
    GridDefaults.DEFAULT_GRID_ROW_HEIGHT;
  const { bottomRow: bottomRowMap, topRow: topRowMap } = dimensionMap;
  // Starting with no height
  let minHeightInRows = 0;
  // Should we be able to collapse widgets
  const shouldCollapse: boolean = yield shouldWidgetsCollapse();
  // Skip this whole process if the parent is collapsed: Process:
  // Get the DataTree
  const dataTree: DataTree = yield select(getDataTree);

  const { children = [] } = widgets[widgetId];
  // For each child widget id.
  for (const childWidgetId of children) {
    // If we've changed the widget's bottomRow via computations
    const { detachFromLayout } = widgets[childWidgetId];
    // We ignore widgets like ModalWidget which don't occupy parent's space.
    // detachFromLayout helps us identify such widgets
    if (detachFromLayout) continue;

    // Seems like sometimes, the children comes in as a string instead of string array.
    // I'm not completely sure why that is, or which widgets use "children" properties as strings
    // So, we're skipping computations for the children if such a thing happens.
    if (widgets[childWidgetId] === undefined) continue;

    // Get this parentContainerWidget from the DataTree
    const dataTreeWidget = dataTree[widgets[childWidgetId].widgetName];
    // If the widget exists, is not visible and we can collapse widgets

    if (
      dataTreeWidget &&
      (dataTreeWidget as WidgetEntity).isVisible !== true &&
      shouldCollapse
    ) {
      continue;
    }

    // Get the child widget's dimenstions from the tree
    const bottomRow = widgets[childWidgetId][bottomRowMap];
    const topRow = widgets[childWidgetId][topRowMap];

    // If this child has changed so far during computations
    if (changesSoFar.hasOwnProperty(childWidgetId)) {
      const collapsing =
        changesSoFar[childWidgetId].bottomRow ===
        changesSoFar[childWidgetId].topRow;

      // If this child is collapsing, don't consider it
      if (!(shouldCollapse && collapsing)) {
        minHeightInRows =
          Math.max(minHeightInRows, changesSoFar[childWidgetId].bottomRow) +
          rowGap;
      }

      // If we need to get the existing bottomRow from the state
    } else {
      // If this child is to collapse, don't consider it.
      if (!(shouldCollapse && bottomRow === topRow))
        minHeightInRows = Math.max(minHeightInRows, bottomRow) + rowGap;
    }
  }
  minHeightInRows -= rowGap;

  if (widgetId === MAIN_CONTAINER_WIDGET_ID) {
    return minHeightInRows + GridDefaults.MAIN_CANVAS_EXTENSION_OFFSET;
  }

  return minHeightInRows;
}

export function* getUpdatesOfAllAutoLayoutCanvasHeight(
  widgets: CanvasWidgetsReduxState,
  dimensionMap: typeof DefaultDimensionMap,
  mainCanvasWidth: number,
  isMobile: boolean,
) {
  const start = performance.now();
  const appMode: APP_MODE = yield select(getAppMode);
  const intialWidgets = { ...widgets };
  const stateWidgets = addWidgetDimensionProxy(dimensionMap, widgets);
  const canvasWidgets: FlattenedWidgetProps[] | undefined = Object.values(
    stateWidgets,
  ).filter((widget: FlattenedWidgetProps) => {
    const isCanvasWidget = widget.type === "CANVAS_WIDGET";
    const parent = widget.parentId ? stateWidgets[widget.parentId] : undefined;
    // List widget cases
    if (
      (parent && parent.disallowCopy) ||
      parent?.hasMetaWidgets ||
      widget.disallowCopy ||
      ["LIST_WIDGET", "LIST_WIDGET_V2"].includes(widget.type)
    ) {
      return false;
    }
    if (parent === undefined) {
      return false;
    }
    return isCanvasWidget;
  });

  const canvasHeightsToUpdate: Record<string, number> = {};
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
      const { maxHeight, minHeight } = getWidgetMinMaxDimensionsInPixel(
        parentContainerWidget,
        mainCanvasWidth,
      );

      // Add parentContainerWidget min height from configuration of widget responsiveness
      const minDynamicHeightInRows = minHeight
        ? minHeight / GridDefaults.DEFAULT_GRID_ROW_HEIGHT
        : WidgetHeightLimits.MIN_HEIGHT_IN_ROWS;
      const maxDynamicHeightInRows = maxHeight
        ? maxHeight / GridDefaults.DEFAULT_GRID_ROW_HEIGHT
        : WidgetHeightLimits.MAX_HEIGHT_IN_ROWS;

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
          yield getAutoLayoutMinHeightBasedOnChildren(
            canvasWidget.widgetId,
            dimensionMap,
            {},
            stateWidgets,
            isMobile,
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
          parentContainerWidget.bottomRow - parentContainerWidget.topRow > 0 ||
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

      if (parentContainerWidget.type === "TABS_WIDGET") {
        const layoutNode = stateWidgets[parentContainerWidget.widgetId];

        if (
          layoutNode &&
          maxBottomRow === layoutNode.bottomRow - layoutNode.topRow
        ) {
          continue;
        }
      }

      // If we have a new height to set and
      if (
        !canvasHeightsToUpdate.hasOwnProperty(parentContainerWidget.widgetId)
      ) {
        canvasHeightsToUpdate[parentContainerWidget.widgetId] =
          maxBottomRow * GridDefaults.DEFAULT_GRID_ROW_HEIGHT;
      }
    }
  }
  let processedWidgets = { ...intialWidgets };
  const widgetHeightUpdates = Object.keys(canvasHeightsToUpdate);
  const { bottomRow: bottomRowMap, topRow: topRowMap } = dimensionMap;
  const changesSoFar: Record<string, { bottomRow: number; topRow: number }> =
    {};
  if (widgetHeightUpdates.length) {
    processedWidgets = widgetHeightUpdates.reduce((updatedWidgets, each) => {
      const widget = updatedWidgets[each];
      const widgetTopRow = widget[topRowMap];
      const rows =
        canvasHeightsToUpdate[each] / GridDefaults.DEFAULT_GRID_ROW_HEIGHT;
      updatedWidgets = {
        ...updatedWidgets,
        [each]: {
          ...widget,
          [bottomRowMap]: widgetTopRow + rows,
        },
      };
      if (widget.type === "MODAL_WIDGET") {
        updatedWidgets = {
          ...updatedWidgets,
          [each]: {
            ...widget,
            height:
              (widgetTopRow + rows) * GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
          },
        };
      }
      changesSoFar[each] = {
        topRow: updatedWidgets[each][topRowMap],
        bottomRow: updatedWidgets[each][bottomRowMap],
      };
      return updatedWidgets;
    }, processedWidgets);
  }
  // Let's consider the minimum Canvas Height
  const mainContainerMinHeight =
    processedWidgets[MAIN_CONTAINER_WIDGET_ID].minHeight;
  const canvasMinHeight: number =
    appMode === APP_MODE.EDIT && mainContainerMinHeight !== undefined
      ? mainContainerMinHeight
      : CANVAS_DEFAULT_MIN_HEIGHT_PX;
  let maxCanvasHeightInRows =
    canvasMinHeight / GridDefaults.DEFAULT_GRID_ROW_HEIGHT;

  // The same logic to compute the minimum height of the MainContainer
  // Based on how many rows are being occuped by children.

  const maxPossibleCanvasHeightInRows: number =
    yield getAutoLayoutMinHeightBasedOnChildren(
      MAIN_CONTAINER_WIDGET_ID,
      dimensionMap,
      changesSoFar,
      processedWidgets,
      isMobile,
    );

  maxCanvasHeightInRows = Math.max(
    maxPossibleCanvasHeightInRows,
    maxCanvasHeightInRows,
  );
  processedWidgets = {
    ...processedWidgets,
    [MAIN_CONTAINER_WIDGET_ID]: {
      ...processedWidgets[MAIN_CONTAINER_WIDGET_ID],
      [bottomRowMap]:
        maxCanvasHeightInRows * GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
    },
  };
  log.debug(
    "Auto Layout Auto height: Canvas computations time taken:",
    performance.now() - start,
    "ms",
  );
  return processedWidgets;
}
