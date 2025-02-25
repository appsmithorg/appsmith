import type { EitherMouseLocationORGridPosition } from "constants/WidgetConstants";
import {
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import type { CanvasWidgetsReduxState } from "ee/reducers/entityReducers/canvasWidgetsReducer";
import { call, select } from "redux-saga/effects";
import { getContainerWidgetSpacesSelector } from "selectors/editorSelectors";
import type { WidgetProps } from "widgets/BaseWidget";
import { getWidget, getWidgets } from "../selectors";

import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import type { WidgetSpace } from "constants/CanvasEditorConstants";
import { getSlidingArenaName } from "constants/componentClassNameConstants";
import { reflow } from "reflow";
import type { PrevReflowState } from "reflow/reflowTypes";
import { ReflowDirection } from "reflow/reflowTypes";
import { getBottomMostRow } from "reflow/reflowUtils";
import { getSelectedWidgets } from "selectors/ui";
import { getBottomRowAfterReflow } from "utils/reflowHookUtils";
import type {
  CopiedWidgetGroup,
  NewPastePositionVariables,
} from "../WidgetOperationUtils";
import {
  WIDGET_PASTE_PADDING,
  changeIdsOfPastePositions,
  getBoundariesFromSelectedWidgets,
  getCanvasIdForContainer,
  getContainerIdForCanvas,
  getDefaultCanvas,
  getMousePositions,
  getNewPositionsForCopiedWidgets,
  getOccupiedSpacesFromProps,
  getPastePositionMapFromMousePointer,
  getSnappedGrid,
  getVerifiedSelectedWidgets,
  getVerticallyAdjustedPositions,
  isDropTarget,
} from "../WidgetOperationUtils";
import _ from "lodash";

export /**
 * Method to provide the new positions where the widgets can be pasted.
 * It will return an empty object if it doesn't have any selected widgets, or if the mouse is outside the canvas.
 *
 * @param copiedWidgetGroups Contains information on the copied widgets
 * @param mouseLocation location of the mouse in absolute pixels
 * @param copiedTotalWidth total width of the copied widgets
 * @param copiedTopMostRow top row of the top most copied widget
 * @param copiedLeftMostColumn left column of the left most copied widget
 * @param gridPosition left and top canvas grid position values
 * @param pastingIntoWidgetId - The ID of the widget where the new widgets should be pasted into.
 * @returns
 */
const getNewPositions = function* (
  copiedWidgetGroups: CopiedWidgetGroup[],
  copiedTotalWidth: number,
  copiedTopMostRow: number,
  copiedLeftMostColumn: number,
  whereToPasteWidget: EitherMouseLocationORGridPosition,
  pastingIntoWidgetId?: string,
) {
  const selectedWidgetIDs: string[] = yield select(getSelectedWidgets);
  const canvasWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
  const { isListWidgetPastingOnItself, selectedWidgets } =
    getVerifiedSelectedWidgets(
      selectedWidgetIDs,
      copiedWidgetGroups,
      canvasWidgets,
    );

  //if the copied widget is a modal widget, then it has to paste on the main container
  if (
    copiedWidgetGroups.length === 1 &&
    copiedWidgetGroups[0].list[0] &&
    copiedWidgetGroups[0].list[0].type === "MODAL_WIDGET"
  )
    return {};

  //if multiple widgets are selected or if a single non-layout widget is selected,
  // then call the method to calculate and return positions based on selected widgets.
  if (
    !(
      selectedWidgets.length === 1 &&
      isDropTarget(selectedWidgets[0].type, true) &&
      !isListWidgetPastingOnItself
    ) &&
    selectedWidgets.length > 0
  ) {
    const newPastingPositionDetails: NewPastePositionVariables = yield call(
      getNewPositionsBasedOnSelectedWidgets,
      copiedWidgetGroups,
      selectedWidgets,
      canvasWidgets,
      copiedTotalWidth,
      copiedTopMostRow,
      copiedLeftMostColumn,
    );

    return newPastingPositionDetails;
  }

  //if a layout widget is selected or mouse is on the main canvas
  // then call the method to calculate and return positions mouse positions.
  const newPastingPositionDetails: NewPastePositionVariables = yield call(
    getNewPositionsBasedOnMousePositions,
    copiedWidgetGroups,
    selectedWidgets,
    canvasWidgets,
    copiedTotalWidth,
    copiedTopMostRow,
    copiedLeftMostColumn,
    whereToPasteWidget,
    pastingIntoWidgetId,
  );

  return newPastingPositionDetails;
};

/**
 * Calculates the new positions of the pasting widgets, based on the mouse position
 * If the mouse position is on the canvas it the top left of the new positions aligns itself to the mouse position
 * returns a empty object if the mouse is out of canvas
 *
 * @param copiedWidgetGroups Contains information on the copied widgets
 * @param mouseLocation location of the mouse in absolute pixels
 * @param selectedWidgets array of selected widgets
 * @param canvasWidgets canvas widgets from the DSL
 * @param copiedTotalWidth total width of the copied widgets
 * @param copiedTopMostRow top row of the top most copied widget
 * @param copiedLeftMostColumn left column of the left most copied widget
 * @param gridPosition left and top canvas grid position values
 * @param pastingIntoWidgetId - The ID of the widget where the new widgets should be pasted into. If this is known we don't need to calculate it. In addition, the container widget and dom queries will be different.
 * @returns
 */
function* getNewPositionsBasedOnMousePositions(
  copiedWidgetGroups: CopiedWidgetGroup[],
  selectedWidgets: WidgetProps[],
  canvasWidgets: CanvasWidgetsReduxState,
  copiedTotalWidth: number,
  copiedTopMostRow: number,
  copiedLeftMostColumn: number,
  whereToPasteWidget: EitherMouseLocationORGridPosition,
  pastingIntoWidgetId?: string,
) {
  let {
    canvasDOM,
    canvasId,
    containerWidget,
  }: {
    canvasDOM: Element | null | undefined;
    canvasId: string | undefined;
    containerWidget: FlattenedWidgetProps | undefined;
  } = getDefaultCanvas(canvasWidgets);

  //if the selected widget is a layout widget then change the pasting canvas.
  if (selectedWidgets.length === 1 && isDropTarget(selectedWidgets[0].type)) {
    containerWidget = selectedWidgets[0];
    ({ canvasDOM, canvasId } = getCanvasIdForContainer(containerWidget));
  }

  if (pastingIntoWidgetId && pastingIntoWidgetId !== MAIN_CONTAINER_WIDGET_ID) {
    // For building block we already know the widget where we want to paste the new widgets
    // no need to calculate it
    const containerWidgetId = getContainerIdForCanvas(pastingIntoWidgetId);

    if (!containerWidgetId) return {};

    containerWidget = yield select(getWidget, containerWidgetId);
    ({ canvasDOM, canvasId } = getCanvasIdForContainer(
      containerWidget as WidgetProps,
    ));
  }

  if (!canvasDOM || !containerWidget || !canvasId) return {};

  const canvasRect = canvasDOM.getBoundingClientRect();

  // get Grid values such as snapRowSpace and snapColumnSpace
  const { padding, snapGrid } = getSnappedGrid(
    containerWidget,
    canvasRect.width,
  );

  // get mouse positions in terms of grid rows and columns of the pasting canvas
  const mousePositions = whereToPasteWidget.gridPosition
    ? whereToPasteWidget.gridPosition
    : getMousePositions(
        canvasRect,
        canvasId,
        snapGrid,
        padding,
        whereToPasteWidget.mouseLocation,
      );

  if (!snapGrid || !mousePositions) return {};

  const reflowSpacesSelector = getContainerWidgetSpacesSelector(canvasId);
  const widgetSpaces: WidgetSpace[] = yield select(reflowSpacesSelector) || [];

  let mouseTopRow = mousePositions.top;
  let mouseLeftColumn = mousePositions.left;

  // if the mouse position is on another widget on the canvas, then new positions are below it.
  for (const widgetSpace of widgetSpaces) {
    if (
      widgetSpace.top < mousePositions.top &&
      widgetSpace.left < mousePositions.left &&
      widgetSpace.bottom > mousePositions.top &&
      widgetSpace.right > mousePositions.left
    ) {
      mouseTopRow = widgetSpace.bottom + WIDGET_PASTE_PADDING;
      mouseLeftColumn =
        widgetSpace.left -
        (copiedTotalWidth - (widgetSpace.right - widgetSpace.left)) / 2;
      break;
    }
  }

  mouseLeftColumn = Math.round(mouseLeftColumn);

  // adjust the top left based on the edges of the canvas
  if (mouseLeftColumn < 0) mouseLeftColumn = 0;

  if (mouseLeftColumn + copiedTotalWidth > GridDefaults.DEFAULT_GRID_COLUMNS)
    mouseLeftColumn = GridDefaults.DEFAULT_GRID_COLUMNS - copiedTotalWidth;

  // get the new Pasting positions of the widgets based on the adjusted mouse top-left
  const newPastingPositionMap = getPastePositionMapFromMousePointer(
    copiedWidgetGroups,
    copiedTopMostRow,
    mouseTopRow,
    copiedLeftMostColumn,
    mouseLeftColumn,
  );

  const gridProps = {
    parentColumnSpace: snapGrid.snapColumnSpace,
    parentRowSpace: snapGrid.snapRowSpace,
    maxGridColumns: GridDefaults.DEFAULT_GRID_COLUMNS,
  };

  // Ids of each pasting are changed just for reflow
  const newPastePositions = changeIdsOfPastePositions(newPastingPositionMap);

  const { movementMap: reflowedMovementMap } = reflow(
    newPastePositions,
    newPastePositions,
    widgetSpaces,
    ReflowDirection.BOTTOM,
    gridProps,
    true,
    false,
    { prevSpacesMap: {} } as PrevReflowState,
  );

  // calculate the new bottom most row of the canvas.
  const bottomMostRow = getBottomRowAfterReflow(
    reflowedMovementMap,
    getBottomMostRow(newPastePositions),
    widgetSpaces,
    gridProps,
  );

  return {
    bottomMostRow:
      (bottomMostRow + GridDefaults.CANVAS_EXTENSION_OFFSET) *
      gridProps.parentRowSpace,
    gridProps,
    newPastingPositionMap,
    reflowedMovementMap,
    canvasId,
  };
}

/**
 * Calculates the new positions of the pasting widgets, based on the selected widgets
 * The new positions will be just below the selected widgets
 *
 * @param copiedWidgetGroups Contains information on the copied widgets
 * @param selectedWidgets array of selected widgets
 * @param canvasWidgets canvas widgets from the DSL
 * @param copiedTotalWidth total width of the copied widgets
 * @param copiedTopMostRow top row of the top most copied widget
 * @param copiedLeftMostColumn left column of the left most copied widget
 * @returns
 */
function* getNewPositionsBasedOnSelectedWidgets(
  copiedWidgetGroups: CopiedWidgetGroup[],
  selectedWidgets: WidgetProps[],
  canvasWidgets: CanvasWidgetsReduxState,
  copiedTotalWidth: number,
  copiedTopMostRow: number,
  copiedLeftMostColumn: number,
) {
  //get Parent canvasId
  const parentId: string | undefined = selectedWidgets[0].parentId;

  // If we failed to get the parent canvas widget Id then return empty object
  if (parentId === undefined) return {};

  // get the Id of the container like widget based on the canvasId
  const containerId = getContainerIdForCanvas(parentId);

  // If we failed to get the containing container like widget Id then return empty object
  if (containerId === undefined) return {};

  const containerWidget = canvasWidgets[containerId];
  const canvasDOM = document.querySelector(`#${getSlidingArenaName(parentId)}`);

  if (!canvasDOM || !containerWidget) return {};

  const rect = canvasDOM.getBoundingClientRect();

  // get Grid values such as snapRowSpace and snapColumnSpace
  const { snapGrid } = getSnappedGrid(containerWidget, rect.width);

  const selectedWidgetsArray = selectedWidgets.length ? selectedWidgets : [];
  //from selected widgets get some information required for position calculation
  const {
    leftMostColumn: selectedLeftMostColumn,
    maxThickness,
    topMostRow: selectedTopMostRow,
    totalWidth,
  } = getBoundariesFromSelectedWidgets(selectedWidgetsArray);

  // calculation of left most column of where widgets are to be pasted
  let pasteLeftMostColumn =
    selectedLeftMostColumn - (copiedTotalWidth - totalWidth) / 2;

  pasteLeftMostColumn = Math.round(pasteLeftMostColumn);

  // conditions to adjust to the edges of the boundary, so that it doesn't go out of canvas
  if (pasteLeftMostColumn < 0) pasteLeftMostColumn = 0;

  if (
    pasteLeftMostColumn + copiedTotalWidth >
    GridDefaults.DEFAULT_GRID_COLUMNS
  )
    pasteLeftMostColumn = GridDefaults.DEFAULT_GRID_COLUMNS - copiedTotalWidth;

  // based on the above calculation get the new Positions that are aligned to the top left of selected widgets
  // i.e., the top of the selected widgets will be equal to the top of copied widgets and both are horizontally centered
  const newPositionsForCopiedWidgets = getNewPositionsForCopiedWidgets(
    copiedWidgetGroups,
    copiedTopMostRow,
    selectedTopMostRow,
    copiedLeftMostColumn,
    pasteLeftMostColumn,
  );

  // with the new positions, calculate the map of new position, which are moved down to the point where
  // it doesn't overlap with any of the selected widgets.
  const newPastingPositionMap = getVerticallyAdjustedPositions(
    newPositionsForCopiedWidgets,
    getOccupiedSpacesFromProps(selectedWidgetsArray),
    maxThickness,
  );

  if (!newPastingPositionMap) return {};

  const gridProps = {
    parentColumnSpace: snapGrid.snapColumnSpace,
    parentRowSpace: snapGrid.snapRowSpace,
    maxGridColumns: GridDefaults.DEFAULT_GRID_COLUMNS,
  };

  const reflowSpacesSelector = getContainerWidgetSpacesSelector(parentId);
  const widgetSpaces: WidgetSpace[] = yield select(reflowSpacesSelector) || [];

  // Ids of each pasting are changed just for reflow
  const newPastePositions = changeIdsOfPastePositions(newPastingPositionMap);

  const { movementMap: reflowedMovementMap } = reflow(
    newPastePositions,
    newPastePositions,
    widgetSpaces,
    ReflowDirection.BOTTOM,
    gridProps,
    true,
    false,
    { prevSpacesMap: {} } as PrevReflowState,
  );

  // calculate the new bottom most row of the canvas
  const bottomMostRow = getBottomRowAfterReflow(
    reflowedMovementMap,
    getBottomMostRow(newPastePositions),
    widgetSpaces,
    gridProps,
  );

  return {
    bottomMostRow:
      (bottomMostRow + GridDefaults.CANVAS_EXTENSION_OFFSET) *
      gridProps.parentRowSpace,
    gridProps,
    newPastingPositionMap,
    reflowedMovementMap,
    canvasId: parentId,
  };
}

export function handleJSONFormPropertiesListedInDynamicBindingPath(
  widget: FlattenedWidgetProps,
  oldName: string,
  newName: string,
) {
  widget.dynamicBindingPathList?.forEach((path: { key: string }) => {
    accessNestedObjectValue(widget, path.key, oldName, newName);
  });
}

/**
 *
 * @param obj This is the object that the function will traverse.
 * @param path: This is a string that specifies the path to the nested value within the object. The path is a string of keys separated by dots (e.g., "key1.key2.key3").
 * @param oldValue: This is the value that the function will look for and replace within the object.
 * @param newValue: This is the value that will replace the oldValue.
 */
export function accessNestedObjectValue(
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: any,
  path: string,
  oldValue: string,
  newValue: string,
) {
  // this function is a utility for finding and replacing a specific value within a nested object structure, given a path to the value.
  // since this replacement can occur multiple times within the object, to prevent unnecessary replacements(& wrong replacements), we check if the value already contains the newValue before replacing it.
  const currentPathValue = _.get(obj, path, "");

  if (!currentPathValue.includes(newValue)) {
    _.set(
      obj,
      path,
      currentPathValue.replace(
        new RegExp(_.escapeRegExp(oldValue), "g"),
        newValue,
      ),
    );
  }
}

export function handleWidgetDynamicTriggerPathList(
  widgetNameMap: Record<string, string>,
  widget: FlattenedWidgetProps,
) {
  Object.entries(widgetNameMap).forEach(([oldWidgetName, newWidgetName]) => {
    widget.dynamicTriggerPathList?.forEach((path: { key: string }) => {
      accessNestedObjectValue(widget, path.key, oldWidgetName, newWidgetName);
    });
  });
}
export function handleWidgetDynamicBindingPathList(
  widgetNameMap: Record<string, string>,
  widget: FlattenedWidgetProps,
) {
  Object.entries(widgetNameMap).forEach(([oldWidgetName, newWidgetName]) => {
    widget.dynamicBindingPathList?.forEach((path: { key: string }) => {
      accessNestedObjectValue(widget, path.key, oldWidgetName, newWidgetName);
    });
  });
}

export function handleWidgetDynamicPropertyPathList(
  widgetNameMap: Record<string, string>,
  widget: FlattenedWidgetProps,
) {
  Object.entries(widgetNameMap).forEach(([oldWidgetName, newWidgetName]) => {
    widget.dynamicPropertyPathList?.forEach((path: { key: string }) => {
      accessNestedObjectValue(widget, path.key, oldWidgetName, newWidgetName);
    });
  });
}
