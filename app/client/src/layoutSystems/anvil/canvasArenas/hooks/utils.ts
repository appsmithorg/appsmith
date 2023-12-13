import type { XYCord } from "layoutSystems/common/canvasArenas/ArenaTypes";
import type { AnvilHighlightInfo, DraggedWidget } from "../../utils/anvilTypes";
import type { DragDetails } from "reducers/uiReducers/dragResizeReducer";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import WidgetFactory from "WidgetProvider/factory";

const DEFAULT_DROP_RANGE = 10;
/**
 * getDraggedBlocks function returns an array of DraggedWidget.
 * If the dragged widget is a new widget pulled out of the widget cards,
 * specific info like type, widgetId and responsiveBehavior are filled using dragDetails
 */

export const getDraggedBlocks = (
  isNewWidget: boolean,
  dragDetails: DragDetails,
  selectedWidgets: string[],
  allWidgets: CanvasWidgetsReduxState,
): DraggedWidget[] => {
  if (isNewWidget) {
    const { newWidget } = dragDetails;
    return [
      {
        parentId: newWidget.parentId,
        responsiveBehavior:
          newWidget.responsiveBehavior ??
          WidgetFactory.getConfig(newWidget.type)?.responsiveBehavior,
        type: newWidget.type,
        widgetId: newWidget.widgetId,
      },
    ];
  } else {
    return selectedWidgets.map((eachWidgetId) => ({
      parentId: allWidgets[eachWidgetId].parentId,
      responsiveBehavior: allWidgets[eachWidgetId].responsiveBehavior,
      type: allWidgets[eachWidgetId].type,
      widgetId: eachWidgetId,
    }));
  }
};
export const getClosestHighlight = (
  e: MouseEvent,
  highlights: AnvilHighlightInfo[],
) => {
  if (!highlights || !highlights.length) return;

  // Current mouse coordinates.
  const pos: XYCord = {
    x: e.offsetX,
    y: e.offsetY,
  };
  /**
   * Filter highlights that  span the current mouse position.
   */
  let filteredHighlights: AnvilHighlightInfo[] = getViableDropPositions(
    highlights,
    pos,
  );
  /**
   * Defensive coding:
   * If filtered highlights are empty,
   * use all highlights for proximity calculation.
   *
   * This is less performant, but improves experience.
   */
  if (!filteredHighlights?.length) {
    filteredHighlights = highlights;
  }

  // Sort filtered highlights in ascending order of distance from mouse position.
  const sortedHighlights = [...filteredHighlights]?.sort((a, b) => {
    return calculateDistance(a, pos) - calculateDistance(b, pos);
  });

  // Return the closest highlight.
  return sortedHighlights[0];
};

export function getViableDropPositions(
  arr: AnvilHighlightInfo[],
  pos: XYCord,
): AnvilHighlightInfo[] {
  if (!arr) return [];

  // Filter out vertical highlights.
  const verticalHighlights = arr.filter(
    (highlight: AnvilHighlightInfo) => highlight.isVertical,
  );

  // Filter out horizontal highlights.
  const horizontalHighlights = arr.filter(
    (highlight: AnvilHighlightInfo) => !highlight.isVertical,
  );

  /**
   * Each vertical highlight has a drop zone on the left and right.
   *
   * <-- left --> | <-- right -->
   *
   * If the mouse is within the drop zone, the highlight is a viable drop position.
   */
  const verticalSelection = verticalHighlights.filter(
    (highlight: AnvilHighlightInfo) => {
      return (
        pos.y >= highlight.posY &&
        pos.y <= highlight.posY + highlight.height &&
        isWithinHorizontalDropZone(pos, highlight)
      );
    },
  );

  /**
   * Each horizontal highlight has a drop zone on the top and bottom.
   *
   *   ^
   *   |
   *  top
   *   |
   *  ---- <- highlight
   *   |
   * bottom
   *   |
   *   ^
   *
   *
   * If the mouse is within the drop zone, the highlight is a viable drop position.
   *
   * If there are also some contending vertical highlights sharing a drop zone,
   * then vertical highlights get priority and the a fraction of the drop zone of horizontal highlights is considered.
   */
  const horizontalSelection = horizontalHighlights.filter(
    (highlight: AnvilHighlightInfo) => {
      return (
        pos.x >= highlight.posX &&
        pos.x <= highlight.posX + highlight.width &&
        isWithinVerticalDropZone(pos, highlight, verticalSelection?.length > 0)
      );
    },
  );

  return [...verticalSelection, ...horizontalSelection];
}

export function isWithinHorizontalDropZone(
  pos: XYCord,
  highlight: AnvilHighlightInfo,
): boolean {
  const rightDropZone = highlight.dropZone?.right || DEFAULT_DROP_RANGE;
  const leftDropZone = highlight.dropZone?.left || DEFAULT_DROP_RANGE;

  const withinRightDropZone =
    pos.x >= highlight.posX &&
    pos.x <= highlight.posX + Math.max(rightDropZone, DEFAULT_DROP_RANGE);
  const withinLeftDropZone =
    pos.x < highlight.posX &&
    pos.x >= highlight.posX - Math.max(leftDropZone, DEFAULT_DROP_RANGE);

  return withinRightDropZone || withinLeftDropZone;
}

export function isWithinVerticalDropZone(
  pos: XYCord,
  highlight: AnvilHighlightInfo,
  hasVerticalSelection: boolean,
): boolean {
  const topDropZone = calculateDropZone(
    highlight.dropZone?.top,
    hasVerticalSelection,
  );
  const bottomDropZone = calculateDropZone(
    highlight.dropZone?.bottom,
    hasVerticalSelection,
  );

  const withinBottomDropZone =
    pos.y >= highlight.posY &&
    pos.y <= highlight.posY + Math.max(bottomDropZone, DEFAULT_DROP_RANGE);
  const withinTopDropZone =
    pos.y < highlight.posY &&
    pos.y >= highlight.posY - Math.max(topDropZone, DEFAULT_DROP_RANGE);

  return withinTopDropZone || withinBottomDropZone;
}

function calculateDropZone(
  dropZoneSide: number | undefined,
  hasVerticalSelection: boolean,
) {
  return dropZoneSide
    ? dropZoneSide * (hasVerticalSelection ? 0.2 : 1)
    : DEFAULT_DROP_RANGE;
}

function calculateDistance(a: AnvilHighlightInfo, b: XYCord): number {
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
  return Math.hypot(distX, distY);
}
