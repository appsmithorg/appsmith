import type { OccupiedSpace } from "constants/CanvasEditorConstants";
import {
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";

export const calculateDropTargetRows = (
  widgetIdsToExclude: string[],
  widgetBottomRow: number,
  occupiedSpacesByChildren?: OccupiedSpace[],
  canvasWidgetId?: string,
) => {
  /* Max bottom row including the existing widgets as well as the widget we just dropped */
  let minBottomRow = widgetBottomRow;

  if (occupiedSpacesByChildren) {
    minBottomRow = occupiedSpacesByChildren.reduce((prev, next) => {
      if (!widgetIdsToExclude.includes(next.id)) {
        return next.bottom > prev ? next.bottom : prev;
      }

      return prev;
    }, widgetBottomRow);
  }

  const canvasOffset =
    canvasWidgetId === MAIN_CONTAINER_WIDGET_ID
      ? GridDefaults.MAIN_CANVAS_EXTENSION_OFFSET
      : GridDefaults.CANVAS_EXTENSION_OFFSET;

  return Math.ceil(minBottomRow + canvasOffset);
};
