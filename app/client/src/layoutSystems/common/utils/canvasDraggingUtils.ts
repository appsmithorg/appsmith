import type {
  OccupiedSpace,
  WidgetSpace,
} from "constants/CanvasEditorConstants";
import { GridDefaults } from "constants/WidgetConstants";
import { isEmpty } from "lodash";
import type { CanvasWidgetsReduxState } from "ee/reducers/entityReducers/canvasWidgetsReducer";
import type { DraggingGroupCenter } from "reducers/uiReducers/dragResizeReducer";
import type {
  MovementLimitMap,
  ReflowedSpaceMap,
  SpaceMap,
} from "reflow/reflowTypes";
import {
  HORIZONTAL_RESIZE_MIN_LIMIT,
  ReflowDirection,
  VERTICAL_RESIZE_MIN_LIMIT,
} from "reflow/reflowTypes";
import type { WidgetType } from "WidgetProvider/factory";
import {
  getDraggingSpacesFromBlocks,
  getDropZoneOffsets,
  noCollision,
} from "utils/WidgetPropsUtils";
import type { WidgetDraggingBlock, XYCord } from "../canvasArenas/ArenaTypes";

/**
 * Method to get the Direction appropriate to closest edge of the canvas
 * @param x x coordinate of mouse position
 * @param y y coordinate of mouse position
 * @param width width of canvas
 * @param currentDirection current direction based on mouse movement
 * @returns closest edge
 */
export const getEdgeDirection = (
  x: number,
  y: number,
  width: number | undefined,
  currentDirection: ReflowDirection,
) => {
  if (width === undefined) return currentDirection;

  const topEdgeDist = Math.abs(y);
  const leftEdgeDist = Math.abs(x);
  const rightEdgeDist = Math.abs(width - x);
  const min = Math.min(topEdgeDist, leftEdgeDist, rightEdgeDist);

  switch (min) {
    case leftEdgeDist:
      return ReflowDirection.RIGHT;
    case rightEdgeDist:
      return ReflowDirection.LEFT;
    case topEdgeDist:
      return ReflowDirection.BOTTOM;
    default:
      return currentDirection;
  }
};

/**
 * Modify the existing space to the reflowed positions
 * @param draggingSpace position object of dragging Space
 * @param reflowingWidgets reflowed parameters of widgets
 * @param snapColumnSpace width between columns
 * @param snapRowSpace height between rows
 * @returns Modified position
 */
export function getReflowedSpaces(
  draggingSpace: OccupiedSpace,
  reflowingWidgets: ReflowedSpaceMap,
  snapColumnSpace: number,
  snapRowSpace: number,
) {
  const reflowedWidget = reflowingWidgets[draggingSpace.id];

  if (
    reflowedWidget.X !== undefined &&
    (Math.abs(reflowedWidget.X) || reflowedWidget.width)
  ) {
    const movement = reflowedWidget.X / snapColumnSpace;
    const newWidth = reflowedWidget.width
      ? reflowedWidget.width / snapColumnSpace
      : draggingSpace.right - draggingSpace.left;

    draggingSpace = {
      ...draggingSpace,
      left: draggingSpace.left + movement,
      right: draggingSpace.left + movement + newWidth,
    };
  }

  if (
    reflowedWidget.Y !== undefined &&
    (Math.abs(reflowedWidget.Y) || reflowedWidget.height)
  ) {
    const movement = reflowedWidget.Y / snapRowSpace;
    const newHeight = reflowedWidget.height
      ? reflowedWidget.height / snapRowSpace
      : draggingSpace.bottom - draggingSpace.top;

    draggingSpace = {
      ...draggingSpace,
      top: draggingSpace.top + movement,
      bottom: draggingSpace.top + movement + newHeight,
    };
  }

  return draggingSpace;
}

interface NewWidgetBlock {
  columns: number;
  rows: number;
  widgetId: string;
  detachFromLayout: boolean;
  isDynamicHeight: boolean;
  type: WidgetType;
}

/**
 * This method returns blocks and dragging spaces of the widgets being dragged on canvas..
 * @param newWidget details about teh new widget that is being dragged on canvas
 * @param allWidgets widgets properties of all the widgets on the page
 * @param isNewWidget indicates if the widget is a new widget
 * @param snapColumnSpace distance between each grid columns in pixels
 * @param snapRowSpace distance between each grid rows in pixels
 * @param childrenOccupiedSpaces array of grid positions of all the widgets on canvas
 * @param selectedWidgets array of selected widget ids
 * @param containerPadding padding in pixels
 * @returns blocksToDraw and draggingSpaces,
 *          blocksToDraw contains information regarding the widget and positions in pixels
 *          draggingSpaces only contains the position of the widget in grid columns and rows
 */
export const getBlocksToDraw = (
  newWidget: NewWidgetBlock,
  allWidgets: CanvasWidgetsReduxState,
  isNewWidget: boolean,
  snapColumnSpace: number,
  snapRowSpace: number,
  childrenOccupiedSpaces: WidgetSpace[],
  selectedWidgets: string[],
  containerPadding: number,
): {
  blocksToDraw: WidgetDraggingBlock[];
  draggingSpaces: OccupiedSpace[];
} => {
  if (isNewWidget) {
    return {
      blocksToDraw: [
        {
          top: 0,
          left: 0,
          width: newWidget.columns * snapColumnSpace,
          height: newWidget.rows * snapRowSpace,
          columnWidth: newWidget.columns,
          rowHeight: newWidget.rows,
          widgetId: newWidget.widgetId,
          detachFromLayout: newWidget.detachFromLayout,
          isNotColliding: true,
          fixedHeight: newWidget.isDynamicHeight
            ? newWidget.rows * snapRowSpace
            : undefined,
          type: newWidget.type,
        },
      ],
      draggingSpaces: [
        {
          top: 0,
          left: 0,
          right: newWidget.columns,
          bottom: newWidget.rows,
          id: newWidget.widgetId,
        },
      ],
    };
  } else {
    const draggingSpaces = childrenOccupiedSpaces.filter((each) =>
      selectedWidgets.includes(each.id),
    );

    return {
      draggingSpaces,
      blocksToDraw: draggingSpaces.map((each) => ({
        top: each.top * snapRowSpace + containerPadding,
        left: each.left * snapColumnSpace + containerPadding,
        width: (each.right - each.left) * snapColumnSpace,
        height: (each.bottom - each.top) * snapRowSpace,
        columnWidth: each.right - each.left,
        rowHeight: each.bottom - each.top,
        widgetId: each.id,
        isNotColliding: true,
        fixedHeight: each.fixedHeight,
        type: allWidgets[each.id].type,
      })),
    };
  }
};

/**
 * This method returns the bound updateRelativeRows method with the arguments bounded
 * @param updateDropTargetRows method to update drop target rows
 * @param snapColumnSpace distance between each grid columns in pixels
 * @param snapRowSpace distance between each grid rows in pixels
 * @returns
 */
export const getBoundUpdateRelativeRowsMethod = (
  updateDropTargetRows:
    | ((
        widgetIdsToExclude: string[],
        widgetBottomRow: number,
      ) => number | false)
    | undefined,
  snapColumnSpace: number,
  snapRowSpace: number,
) => {
  return (drawingBlocks: WidgetDraggingBlock[], rows: number) => {
    if (drawingBlocks.length) {
      const sortedByTopBlocks = drawingBlocks.sort(
        (each1, each2) => each2.top + each2.height - (each1.top + each1.height),
      );
      const bottomMostBlock = sortedByTopBlocks[0];
      const [, top] = getDropZoneOffsets(
        snapColumnSpace,
        snapRowSpace,
        {
          x: bottomMostBlock.left,
          y: bottomMostBlock.top + bottomMostBlock.height,
        } as XYCord,
        { x: 0, y: 0 },
      );
      const widgetIdsToExclude = drawingBlocks.map((a) => a.widgetId);

      return updateBottomRow(
        top,
        rows,
        widgetIdsToExclude,
        updateDropTargetRows,
      );
    }
  };
};

/**
 * This method helps in updating rows for dropTarget/canvas by using calling updateDropTargetRows passed down
 * @param bottom new bottom most row of canvas
 * @param rows number of rows of canvas
 * @param widgetIdsToExclude array of widget ids to be excluded
 * @param updateDropTargetRows method to update drop target rows
 * @returns
 */
export const updateBottomRow = (
  bottom: number,
  rows: number,
  widgetIdsToExclude: string[],
  updateDropTargetRows:
    | ((
        widgetIdsToExclude: string[],
        widgetBottomRow: number,
      ) => number | false)
    | undefined,
) => {
  if (bottom > rows - GridDefaults.CANVAS_EXTENSION_OFFSET) {
    return (
      updateDropTargetRows && updateDropTargetRows(widgetIdsToExclude, bottom)
    );
  }
};

/**
 * Calculates positions in pixels that needs to be offsetted with the widget's positions to get it's actual position on parent canvas
 * @param dragCenterSpace position of the current widget that was grabbed while dragging
 * @param isDragging indicates if currently in dragging state
 * @param isChildOfCanvas indicates if the dragging widgets are the original child of the canvas
 * @param snapRowSpace distance between each grid columns in pixels
 * @param snapColumnSpace distance between each grid rows in pixels
 * @param containerPadding padding in pixels
 * @returns
 */
export const getParentDiff = (
  dragCenterSpace: { top: number; left: number },
  isDragging: boolean,
  isChildOfCanvas: boolean,
  snapRowSpace: number,
  snapColumnSpace: number,
  containerPadding: number,
) => {
  let parentDiff = {
    top: 0,
    left: 0,
  };

  if (isDragging) {
    const shouldCalculateParentDiff =
      !isChildOfCanvas && !isEmpty(dragCenterSpace);

    if (shouldCalculateParentDiff) {
      parentDiff = {
        top: dragCenterSpace.top * snapRowSpace + containerPadding,
        left: dragCenterSpace.left * snapColumnSpace + containerPadding,
      };
    } else {
      parentDiff = {
        top: containerPadding,
        left: containerPadding,
      };
    }
  }

  return parentDiff;
};

/**
 * returns the relative drag start points of the dragging blocks with respect to the dragging group's center
 * @param dragCenterSpace position of the current widget that was grabbed while dragging
 * @param dragOffset offset of the positions at which the widgets were grabbed for dragging
 * @param defaultHandlePositions default handle positions in pixels
 * @param isDragging indicates if currently in dragging state
 * @param isChildOfCanvas indicates if the dragging widgets are the original child of the canvas
 * @param snapRowSpace distance between each grid columns in pixels
 * @param snapColumnSpace distance between each grid rows in pixels
 * @param containerPadding padding in pixels
 * @returns
 */
export const getRelativeStartPoints = (
  dragCenterSpace: { top: number; left: number },
  dragOffset: { top: number; left: number },
  defaultHandlePositions: { top: number; left: number },
  isDragging: boolean,
  isChildOfCanvas: boolean,
  snapRowSpace: number,
  snapColumnSpace: number,
  containerPadding: number,
) => {
  let relativeStartPoints = defaultHandlePositions;

  if (isDragging && !isEmpty(dragCenterSpace)) {
    const dragLeft = isChildOfCanvas ? dragCenterSpace.left : 0;
    const dragTop = isChildOfCanvas ? dragCenterSpace.top : 0;

    relativeStartPoints = {
      left:
        (dragLeft + dragOffset?.left || 0) * snapColumnSpace +
        2 * containerPadding,
      top:
        (dragTop + dragOffset?.top || 0) * snapRowSpace + 2 * containerPadding,
    };
  }

  return relativeStartPoints;
};

/**
 * returns the position of the current widget that was grabbed while dragging
 * @param dragCenter
 * @param childrenOccupiedSpaces
 * @returns
 */
export const getDragCenterSpace = (
  dragCenter: DraggingGroupCenter | undefined,
  childrenOccupiedSpaces: WidgetSpace[],
): { top: number; left: number } => {
  const defaultDragCenterSpace = { left: 0, top: 0 };

  if (dragCenter && dragCenter.widgetId) {
    // Dragging by widget
    return (
      childrenOccupiedSpaces.find((each) => each.id === dragCenter.widgetId) ||
      defaultDragCenterSpace
    );
  } else if (dragCenter && dragCenter.top && dragCenter.left) {
    // Dragging by Widget selection box
    return { top: dragCenter.top, left: dragCenter.left };
  } else {
    return defaultDragCenterSpace;
  }
};

/**
 * Modify the rectangles to draw object to match the positions of spaceMap
 * @param rectanglesToDraw dragging parameters of widget
 * @param spaceMap Widget Position
 * @param snapColumnSpace width between columns
 * @param snapRowSpace height between rows
 * @returns modified rectangles to draw
 */
export function modifyDrawingRectangles(
  rectanglesToDraw: WidgetDraggingBlock[],
  spaceMap: SpaceMap | undefined,
  snapColumnSpace: number,
  snapRowSpace: number,
): WidgetDraggingBlock[] {
  const rectangleToDraw = rectanglesToDraw?.[0];

  if (rectanglesToDraw.length !== 1 || !spaceMap?.[rectangleToDraw?.widgetId])
    return rectanglesToDraw;

  const { bottom, left, right, top } = spaceMap[rectangleToDraw.widgetId];

  const resizedPosition = getDraggingSpacesFromBlocks(
    rectanglesToDraw,
    snapColumnSpace,
    snapRowSpace,
  )[0];

  return [
    {
      ...rectanglesToDraw[0],
      left:
        (left - resizedPosition.left) * snapColumnSpace +
        rectanglesToDraw[0].left,
      top: (top - resizedPosition.top) * snapRowSpace + rectanglesToDraw[0].top,
      width: (right - left) * snapColumnSpace,
      height: (bottom - top) * snapRowSpace,
      rowHeight: bottom - top,
      columnWidth: right - left,
    },
  ];
}

/**
 * Direction of movement based on previous position of dragging widget
 * @param prevPosition
 * @param currentPosition
 * @param currentDirection
 * @returns movement direction
 */
export function getMoveDirection(
  prevPosition: OccupiedSpace | null,
  currentPosition: OccupiedSpace,
  currentDirection: ReflowDirection,
) {
  if (!prevPosition || !currentPosition) return currentDirection;

  if (
    currentPosition.right - prevPosition.right > 0 ||
    currentPosition.left - prevPosition.left > 0
  )
    return ReflowDirection.RIGHT;

  if (
    currentPosition.right - prevPosition.right < 0 ||
    currentPosition.left - prevPosition.left < 0
  )
    return ReflowDirection.LEFT;

  if (
    currentPosition.bottom - prevPosition.bottom > 0 ||
    currentPosition.top - prevPosition.top > 0
  )
    return ReflowDirection.BOTTOM;

  if (
    currentPosition.bottom - prevPosition.bottom < 0 ||
    currentPosition.top - prevPosition.top < 0
  )
    return ReflowDirection.TOP;

  return currentDirection;
}

/**
 * Modify the dragging Blocks to resize against canvas edges
 * @param draggingBlock
 * @param snapColumnSpace
 * @param snapRowSpace
 * @param parentBottomRow
 * @param canExtend
 * @returns
 */
export const modifyBlockDimension = (
  draggingBlock: WidgetDraggingBlock,
  snapColumnSpace: number,
  snapRowSpace: number,
  parentBottomRow: number,
  canExtend: boolean,
  modifyBlock: boolean,
  // this allows dynamic resize limit for building blocks
  horizontalMinResizeLimit: number = HORIZONTAL_RESIZE_MIN_LIMIT,
  verticalMinResizeLimit: number = VERTICAL_RESIZE_MIN_LIMIT,
) => {
  const { columnWidth, fixedHeight, height, left, rowHeight, top, width } =
    draggingBlock;
  //get left and top of widget on canvas grid
  const [leftColumn, topRow] = getDropZoneOffsets(
    snapColumnSpace,
    snapRowSpace,
    {
      x: left,
      y: top,
    },
    {
      x: 0,
      y: 0,
    },
  );
  let leftOffset = 0,
    rightOffset = 0,
    topOffset = 0,
    bottomOffset = 0;

  if (!modifyBlock) {
    // calculate offsets based on collisions and limits
    if (leftColumn < 0) {
      leftOffset =
        leftColumn + columnWidth > horizontalMinResizeLimit
          ? leftColumn
          : horizontalMinResizeLimit - columnWidth;
    } else if (leftColumn + columnWidth > GridDefaults.DEFAULT_GRID_COLUMNS) {
      rightOffset =
        GridDefaults.DEFAULT_GRID_COLUMNS - leftColumn - columnWidth;
      rightOffset =
        columnWidth + rightOffset >= horizontalMinResizeLimit
          ? rightOffset
          : horizontalMinResizeLimit - columnWidth;
    }

    if (topRow < 0 && fixedHeight === undefined) {
      topOffset =
        topRow + rowHeight > verticalMinResizeLimit
          ? topRow
          : verticalMinResizeLimit - rowHeight;
    }

    if (
      topRow + rowHeight > parentBottomRow &&
      !canExtend &&
      fixedHeight === undefined
    ) {
      bottomOffset = parentBottomRow - topRow - rowHeight;
      bottomOffset =
        rowHeight + bottomOffset >= verticalMinResizeLimit
          ? bottomOffset
          : verticalMinResizeLimit - rowHeight;
    }
  }

  return {
    ...draggingBlock,
    left: left - leftOffset * snapColumnSpace,
    top: top - topOffset * snapRowSpace,
    width: width + (leftOffset + rightOffset) * snapColumnSpace,
    height: height + (topOffset + bottomOffset) * snapRowSpace,
    columnWidth: columnWidth + leftOffset + rightOffset,
    rowHeight: rowHeight + topOffset + bottomOffset,
  };
};

/**
 * updates isColliding of each block based on movementLimitMap post reflow
 * @param movementLimitMap limits of each widgets
 * @param currentRectanglesToDraw dragging parameters of widget
 * @param snapColumnSpace width between each columns
 * @param snapRowSpace height between each rows
 * @param rows number of rows in canvas
 * @returns array of rectangle blocks to draw
 */
export const updateRectanglesPostReflow = (
  movementLimitMap: MovementLimitMap | undefined,
  currentRectanglesToDraw: WidgetDraggingBlock[],
  snapColumnSpace: number,
  snapRowSpace: number,
  rows: number,
) => {
  const rectanglesToDraw: WidgetDraggingBlock[] = [];

  for (const block of currentRectanglesToDraw) {
    const isWithinParentBoundaries = noCollision(
      { x: block.left, y: block.top },
      snapColumnSpace,
      snapRowSpace,
      { x: 0, y: 0 },
      block.columnWidth,
      block.rowHeight,
      block.widgetId,
      [],
      rows,
      GridDefaults.DEFAULT_GRID_COLUMNS,
      block.detachFromLayout,
    );

    let isNotReachedLimit = true;
    const currentBlockLimit =
      movementLimitMap && movementLimitMap[block.widgetId];

    if (currentBlockLimit) {
      isNotReachedLimit =
        currentBlockLimit.canHorizontalMove &&
        currentBlockLimit.canVerticalMove;
    }

    rectanglesToDraw.push({
      ...block,
      isNotColliding: isWithinParentBoundaries && isNotReachedLimit,
    });
  }

  return rectanglesToDraw;
};
