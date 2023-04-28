import type {
  CanvasWidgetsReduxState,
  UpdateWidgetsPayload,
} from "reducers/entityReducers/canvasWidgetsReducer";
import { call, put, select } from "redux-saga/effects";
import {
  alterLayoutForDesktop,
  alterLayoutForMobile,
  getCanvasDimensions,
} from "utils/autoLayout/AutoLayoutUtils";
import {
  getCanvasAndMetaWidgets,
  getWidgets,
  getWidgetsMeta,
} from "../selectors";
import type { DefaultDimensionMap } from "constants/WidgetConstants";
import {
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import {
  addWidgetDimensionProxy,
  getDimensionMap,
  getIsAutoLayout,
  getIsAutoLayoutMobileBreakPoint,
} from "selectors/editorSelectors";
import { getCanvasWidth as getMainCanvasWidth } from "selectors/editorSelectors";
import {
  getLeftColumn,
  getTopRow,
  setBottomRow,
  setRightColumn,
} from "utils/autoLayout/flexWidgetUtils";
import { isEmpty } from "lodash";
import { getIsCurrentlyConvertingLayout } from "selectors/autoLayoutSelectors";
import {
  mutation_setPropertiesToUpdate,
  shouldWidgetsCollapse,
} from "sagas/autoHeightSagas/helpers";
import { getDataTree } from "selectors/dataTreeSelectors";
import type { DataTree, WidgetEntity } from "entities/DataTree/dataTreeFactory";
import { APP_MODE } from "entities/App";
import { CANVAS_DEFAULT_MIN_HEIGHT_PX } from "constants/AppConstants";
import { getAppMode } from "selectors/entitiesSelector";
import { MOBILE_ROW_GAP, ROW_GAP } from "utils/autoLayout/constants";
import { updateWidgetPositions } from "utils/autoLayout/positionUtils";
import {
  updateMultipleMetaWidgetPropertiesAction,
  updateMultipleWidgetPropertiesAction,
} from "actions/controlActions";

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
  const metaProps: Record<string, any> = yield select(getWidgetsMeta);
  const selectedTabWidgetId: string | undefined =
    metaProps[parentId]?.selectedTabWidgetId || undefined;
  let processedWidgets: CanvasWidgetsReduxState = isMobile
    ? alterLayoutForMobile(
        allWidgets,
        parentId,
        canvasWidth,
        mainCanvasWidth,
        false,
        selectedTabWidgetId,
      )
    : alterLayoutForDesktop(
        allWidgets,
        parentId,
        mainCanvasWidth,
        false,
        selectedTabWidgetId,
      );
  const dimensionMap: typeof DefaultDimensionMap = yield select(
    getDimensionMap,
  );
  processedWidgets = yield call(
    processAutoLayoutMainCanvasHeight,
    processedWidgets,
    dimensionMap,
    isMobile,
  );
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

function* processAutoLayoutDimensionUpdatesFn(
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
  const metaProps: Record<string, any> = yield select(getWidgetsMeta);
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
    const selectedTabWidgetId: string | undefined =
      metaProps[parentId]?.selectedTabWidgetId || undefined;
    processedWidgets = updateWidgetPositions(
      processedWidgets,
      parentId,
      isMobile,
      mainCanvasWidth,
      false,
      selectedTabWidgetId,
    );
  }

  // Gets only the widgets that need to be updated
  yield call(getWidgetsWithDimensionChanges, processedWidgets);
  const widgetsToUpdate: UpdateWidgetsPayload = yield call(
    getWidgetsWithDimensionChanges,
    processedWidgets,
  );

  const canvasWidgetsToUpdate: UpdateWidgetsPayload = {};
  const metaWidgetsToUpdate: UpdateWidgetsPayload = {};

  for (const widgetId in widgetsToUpdate) {
    const widget = processedWidgets[widgetId];
    if (widget.isMetaWidget) {
      metaWidgetsToUpdate[widgetId] = widgetsToUpdate[widgetId];
    } else {
      canvasWidgetsToUpdate[widgetId] = widgetsToUpdate[widgetId];
    }
  }

  // Push all updates to the CanvasWidgetsReducer.
  // Note that we're not calling `UPDATE_LAYOUT`
  // as we don't need to trigger an eval
  if (!isEmpty(canvasWidgetsToUpdate)) {
    yield put(updateMultipleWidgetPropertiesAction(canvasWidgetsToUpdate));
  }
  if (!isEmpty(metaWidgetsToUpdate)) {
    yield put(updateMultipleMetaWidgetPropertiesAction(metaWidgetsToUpdate));
  }

  // clear the batch after processing
  autoLayoutWidgetDimensionUpdateBatch = {};
}

function* getAutoLayoutMinHeightBasedOnChildren(
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

function* processAutoLayoutMainCanvasHeight(
  widgets: CanvasWidgetsReduxState,
  dimensionMap: typeof DefaultDimensionMap,
  isMobile: boolean,
) {
  const appMode: APP_MODE = yield select(getAppMode);
  let processedWidgets = addWidgetDimensionProxy(dimensionMap, widgets);
  const { bottomRow: bottomRowMap } = dimensionMap;

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
      {},
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
  return processedWidgets;
}
