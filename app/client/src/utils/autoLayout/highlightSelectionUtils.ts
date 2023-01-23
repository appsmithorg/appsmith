import { HighlightInfo } from "pages/common/CanvasArenas/hooks/useAutoLayoutHighlights";
import { ReflowDirection } from "reflow/reflowTypes";
import { FlexLayerAlignment, LayoutDirection } from "./constants";

export interface Point {
  x: number;
  y: number;
}

/**
 * Select the closest highlight to the mouse position (in the direction of the).
 * @param highlights | HighlightInfo[] : all highlights for the current canvas.
 * @param direction | LayoutDirection | undefined : direction of the stacking.
 * @param isFillWidget | boolean : determines if the dragged widgets contain a fill widget.
 * @param e | any : mouse event.
 * @param moveDirection | ReflowDirection : direction of the drag.
 * @param val | Point : mouse coordinates.
 * @returns HighlightInfo | undefined
 */
export const getHighlightPayload = (
  highlights: HighlightInfo[],
  direction: LayoutDirection | undefined,
  isFillWidget: boolean,
  e: any,
  moveDirection?: ReflowDirection,
  val?: Point,
): HighlightInfo | undefined => {
  if (!highlights || !highlights.length) return;

  // Current mouse coordinates.
  const pos: Point = {
    x: e?.offsetX || val?.x,
    y: e?.offsetY || val?.y,
  };

  /**
   * If the mouse is within 10px of a highlight, return that highlight.
   */
  const closestHighlight: HighlightInfo | undefined = getClosestHighlight(
    highlights,
    pos,
  );
  if (closestHighlight) return closestHighlight;

  /**
   * Filter highlights that are in the direction of the drag
   * and span the current mouse position.
   */
  let filteredHighlights: HighlightInfo[] = [];
  filteredHighlights = getViableDropPositions(
    highlights,
    pos,
    isFillWidget,
    moveDirection,
    direction,
  );
  if (!filteredHighlights || !filteredHighlights?.length) return;

  // Sort filtered highlights in ascending order of distance from mouse position.
  const arr = [...filteredHighlights]?.sort((a, b) => {
    return (
      calculateDirectionalDistance(a, pos, moveDirection) -
      calculateDirectionalDistance(b, pos, moveDirection)
    );
  });

  // console.log("#### arr", arr, highlights, moveDirection);

  // Return the closest highlight.
  return arr[0];
};

/**
 * Filter highlights based on direction of drag.
 * @param arr | HighlightInfo[] : all highlights for the current canvas.
 * @param pos | Point : current mouse coordinates.
 * @param isFillWidget | boolean : determines if the dragged widgets contain a fill widget.
 * @param moveDirection | ReflowDirection : direction of the drag.
 * @param direction | LayoutDirection | undefined : direction of the stacking.
 * @returns HighlightInfo | undefined
 */
function getViableDropPositions(
  arr: HighlightInfo[],
  pos: Point,
  isFillWidget: boolean,
  moveDirection?: ReflowDirection,
  direction?: LayoutDirection,
): HighlightInfo[] {
  if (!moveDirection || !arr) return arr || [];
  const isVerticalDrag = [ReflowDirection.TOP, ReflowDirection.BOTTOM].includes(
    moveDirection,
  );
  return direction === LayoutDirection.Vertical
    ? getVerticalStackDropPositions(arr, pos, isVerticalDrag, isFillWidget)
    : getHorizontalStackDropPositions(arr, pos);
}

/**
 * Calculate the distance between the mouse position and the highlight.
 * Return the closest highlight if distance <= 10px.
 * @param arr | HighlightInfo[] : all highlights for the current canvas.
 * @param pos | Point : current mouse coordinates.
 * @returns HighlightInfo | undefined
 */
function getClosestHighlight(
  arr: HighlightInfo[],
  pos: Point,
): HighlightInfo | undefined {
  if (!arr || !pos) return;
  const res: HighlightInfo[] = arr.filter((highlight: HighlightInfo) => {
    const distance = calculateActualDistance(highlight, pos);
    return distance <= 10;
  });
  if (!res.length) return;
  return res.sort((a, b) => {
    return calculateActualDistance(a, pos) - calculateActualDistance(b, pos);
  })[0];
}

function getVerticalStackDropPositions(
  arr: HighlightInfo[],
  pos: Point,
  isVerticalDrag: boolean,
  isFillWidget: boolean,
): HighlightInfo[] {
  // For vertical stacks, filter out the highlights based on drag direction and y position.
  let filteredHighlights: HighlightInfo[] = arr.filter(
    (highlight: HighlightInfo) => {
      // Return only horizontal highlights for vertical drag.
      if (isVerticalDrag)
        return (
          !highlight.isVertical &&
          highlight.width > 0 &&
          pos.x > 0 &&
          pos.y > 0 &&
          pos.x >= highlight.posX &&
          pos.x <= highlight.posX + highlight.width
        );
      // Return only vertical highlights for horizontal drag, if they lie in the same x plane.
      return (
        highlight.isVertical &&
        pos.y >= highlight.posY &&
        pos.y <= highlight.posY + highlight.height
      );
    },
  );
  /**
   * For horizontal drag, if no vertical highlight exists in the same x plane,
   * return the horizontal highlights for the last layer.
   * In case of a dragged Fill widget, only return the Start alignment as it will span the entire width.
   */
  if (!isVerticalDrag && !filteredHighlights.length)
    filteredHighlights = arr
      .slice(arr.length - 3)
      .filter((highlight: HighlightInfo) =>
        !highlight.isVertical && isFillWidget
          ? highlight.alignment === FlexLayerAlignment.Start
          : true,
      );

  return filteredHighlights;
}

function getHorizontalStackDropPositions(
  arr: HighlightInfo[],
  pos: Point,
): HighlightInfo[] {
  // For horizontal stack, return the highlights that lie in the same x plane.
  let filteredHighlights = arr.filter(
    (highlight) =>
      pos.y >= highlight.posY && pos.y <= highlight.posY + highlight.height,
  );
  // If no highlight exists in the same x plane, return the last highlight.
  if (!filteredHighlights.length) filteredHighlights = [arr[arr.length - 1]];
  return filteredHighlights;
}

/**
 * Calculate distance between the mouse position and the closest point on the highlight.
 *
 * @param a | HighlightInfo : current highlight.
 * @param b | Point : current mouse position.
 * @param moveDirection | ReflowDirection : current drag direction.
 * @returns number
 */
function calculateDirectionalDistance(
  a: HighlightInfo,
  b: Point,
  moveDirection?: ReflowDirection,
): number {
  let { distX, distY } = getXYDistance(a, b);
  /**
   * Emphasize move direction over actual distance.
   *
   * If the point is close to a highlight. However, it is moving in the opposite direction,
   * then increase the appropriate distance to ensure that this highlight is discounted.
   */
  if (moveDirection === ReflowDirection.RIGHT && distX > 20) distX += 2000;
  if (moveDirection === ReflowDirection.LEFT && distX < -20) distX -= 2000;
  if (moveDirection === ReflowDirection.BOTTOM && distY > 20) distY += 2000;
  if (moveDirection === ReflowDirection.TOP && distY < -20) distY -= 2000;

  return Math.abs(Math.sqrt(distX * distX + distY * distY));
}

function getXYDistance(
  a: HighlightInfo,
  b: Point,
): { distX: number; distY: number } {
  let distX = 0,
    distY = 0;
  if (a.isVertical) {
    distX = b.x - a.posX;
    if (b.y < a.posY) {
      distY = b.y - a.posY;
    } else if (b.y > a.posY + a.height) {
      distY = b.y - (a.posY + a.height);
    } else {
      distY = 0;
    }
  } else {
    distY = b.y - a.posY;
    if (b.x < a.posX) {
      distX = b.x - a.posX;
    } else if (b.x > a.posX + a.width) {
      distX = b.x - (a.posX + a.width);
    } else {
      distX = 0;
    }
  }
  return { distX, distY };
}

function calculateActualDistance(a: HighlightInfo, b: Point): number {
  const { distX, distY } = getXYDistance(a, b);
  return Math.abs(Math.sqrt(distX * distX + distY * distY));
}
