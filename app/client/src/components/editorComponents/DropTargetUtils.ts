import { OccupiedSpace } from "constants/editorConstants";
import { GridDefaults } from "constants/WidgetConstants";

export const calculateDropTargetRows = (
  widgetId: string,
  widgetBottomRow: number,
  defaultRows: number,
  occupiedSpacesByChildren?: OccupiedSpace[],
) => {
  /* Max bottom row including the existing widgets as well as the widget we just dropped */
  let minBottomRow = widgetBottomRow;
  if (occupiedSpacesByChildren) {
    minBottomRow = occupiedSpacesByChildren.reduce((prev, next) => {
      if (next.id !== widgetId) {
        return next.bottom > prev ? next.bottom : prev;
      }
      return prev;
    }, widgetBottomRow);
  }

  return Math.ceil(
    Math.max(minBottomRow + GridDefaults.CANVAS_EXTENSION_OFFSET, defaultRows),
  );
};
