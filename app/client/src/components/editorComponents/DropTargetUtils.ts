import { OccupiedSpace } from "constants/CanvasEditorConstants";
import { GridDefaults } from "constants/WidgetConstants";

export const calculateDropTargetRows = (
  widgetIdsToExclude: string[],
  widgetBottomRow: number,
  defaultRows: number,
  occupiedSpacesByChildren?: OccupiedSpace[],
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

  return Math.ceil(
    Math.max(minBottomRow + GridDefaults.CANVAS_EXTENSION_OFFSET, defaultRows),
  );
};
