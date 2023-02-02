import { ReflowDirection } from "reflow/reflowTypes";
import { HighlightInfo } from "./highlightUtils";

export interface Point {
  x: number;
  y: number;
}

/**
 * Select the closest highlight to the mouse position (in the direction of the).
 * @param highlights | HighlightInfo[] : all highlights for the current canvas.
 * @param e | any : mouse event.
 * @param moveDirection | ReflowDirection : direction of the drag.
 * @param val | Point : mouse coordinates.
 * @returns HighlightInfo | undefined
 */
export const getHighlightPayload = (
  highlights: HighlightInfo[],
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
   * Filter highlights that  span the current mouse position.
   */
  let filteredHighlights: HighlightInfo[] = [];
  filteredHighlights = getViableDropPositions(highlights, pos, moveDirection);
  if (!filteredHighlights || !filteredHighlights?.length) return;

  // Sort filtered highlights in ascending order of distance from mouse position.
  const arr = [...filteredHighlights]?.sort((a, b) => {
    return calculateDistance(a, pos) - calculateDistance(b, pos);
  });

  // console.log("#### arr", arr, highlights, moveDirection);

  // Return the closest highlight.
  return arr[0];
};

/**
 * Filter highlights based on direction of drag.
 * @param arr | HighlightInfo[] : all highlights for the current canvas.
 * @param pos | Point : current mouse coordinates.
 * @param moveDirection | ReflowDirection : direction of the drag.
 * @returns HighlightInfo | undefined
 */
function getViableDropPositions(
  arr: HighlightInfo[],
  pos: Point,
  moveDirection?: ReflowDirection,
): HighlightInfo[] {
  if (!moveDirection || !arr) return arr || [];
  const DEFAULT_DROP_RANGE = 10;
  const verticalHighlights = arr.filter(
    (highlight: HighlightInfo) => highlight.isVertical,
  );
  const horizontalHighlights = arr.filter(
    (highlight: HighlightInfo) => !highlight.isVertical,
  );
  const selection: HighlightInfo[] = [];
  verticalHighlights.forEach((highlight: HighlightInfo) => {
    if (pos.y >= highlight.posY && pos.y <= highlight.posY + highlight.height)
      if (
        (pos.x >= highlight.posX &&
          pos.x <=
            highlight.posX +
              (highlight.dropZone?.right || DEFAULT_DROP_RANGE)) ||
        (pos.x < highlight.posX &&
          pos.x >=
            highlight.posX - (highlight.dropZone?.left || DEFAULT_DROP_RANGE))
      )
        selection.push(highlight);
  });
  const hasVerticalSelection = selection.length > 0;
  const dropArea = localStorage.getItem("horizontalHighlightDropArea");
  const zoneSize = dropArea ? parseFloat(dropArea) : 0;
  horizontalHighlights.forEach((highlight: HighlightInfo) => {
    if (pos.x >= highlight.posX && pos.x <= highlight.posX + highlight.width)
      if (
        (pos.y >= highlight.posY &&
          pos.y <=
            highlight.posY +
              (highlight.dropZone?.bottom !== undefined
                ? highlight.dropZone?.bottom *
                  (hasVerticalSelection ? zoneSize : 1)
                : DEFAULT_DROP_RANGE)) ||
        (pos.y < highlight.posY &&
          pos.y >=
            highlight.posY -
              (highlight.dropZone?.top !== undefined
                ? highlight.dropZone?.top *
                  (hasVerticalSelection ? zoneSize + 0.1 : 1)
                : DEFAULT_DROP_RANGE))
      )
        selection.push(highlight);
  });
  return selection;
}

function calculateDistance(a: HighlightInfo, b: Point): number {
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
  return Math.abs(Math.sqrt(distX * distX + distY * distY));
}
