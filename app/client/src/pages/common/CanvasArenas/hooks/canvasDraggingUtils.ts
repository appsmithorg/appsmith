import { OccupiedSpace } from "constants/CanvasEditorConstants";
import { GridDefaults } from "constants/WidgetConstants";
import {
  HORIZONTAL_RESIZE_MIN_LIMIT,
  MovementLimitMap,
  ReflowDirection,
  ReflowedSpaceMap,
  SpaceMap,
  VERTICAL_RESIZE_MIN_LIMIT,
} from "reflow/reflowTypes";
import {
  getDraggingSpacesFromBlocks,
  getDropZoneOffsets,
  noCollision,
} from "utils/WidgetPropsUtils";
import { WidgetDraggingBlock } from "./useBlocksToBeDraggedOnCanvas";

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
) => {
  const {
    columnWidth,
    fixedHeight,
    height,
    left,
    rowHeight,
    top,
    width,
  } = draggingBlock;

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
        leftColumn + columnWidth > HORIZONTAL_RESIZE_MIN_LIMIT
          ? leftColumn
          : HORIZONTAL_RESIZE_MIN_LIMIT - columnWidth;
    } else if (leftColumn + columnWidth > GridDefaults.DEFAULT_GRID_COLUMNS) {
      rightOffset =
        GridDefaults.DEFAULT_GRID_COLUMNS - leftColumn - columnWidth;
      rightOffset =
        columnWidth + rightOffset >= HORIZONTAL_RESIZE_MIN_LIMIT
          ? rightOffset
          : HORIZONTAL_RESIZE_MIN_LIMIT - columnWidth;
    }

    if (topRow < 0 && fixedHeight === undefined) {
      topOffset =
        topRow + rowHeight > VERTICAL_RESIZE_MIN_LIMIT
          ? topRow
          : VERTICAL_RESIZE_MIN_LIMIT - rowHeight;
    }

    if (
      topRow + rowHeight > parentBottomRow &&
      !canExtend &&
      fixedHeight === undefined
    ) {
      bottomOffset = parentBottomRow - topRow - rowHeight;
      bottomOffset =
        rowHeight + bottomOffset >= VERTICAL_RESIZE_MIN_LIMIT
          ? bottomOffset
          : VERTICAL_RESIZE_MIN_LIMIT - rowHeight;
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
