import { OccupiedSpace } from "constants/CanvasEditorConstants";
import {
  ReflowDirection,
  ReflowedSpaceMap,
  SpaceMap,
} from "reflow/reflowTypes";
import { getDraggingSpacesFromBlocks } from "utils/WidgetPropsUtils";
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
  if (
    rectanglesToDraw.length !== 1 ||
    !spaceMap?.[rectanglesToDraw[0]?.widgetId]
  )
    return rectanglesToDraw;

  const { bottom, left, right, top } = spaceMap[rectanglesToDraw[0].widgetId];

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
  prevPosition: OccupiedSpace,
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
