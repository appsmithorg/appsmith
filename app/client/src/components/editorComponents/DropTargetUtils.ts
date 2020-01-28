import { GridDefaults } from "constants/WidgetConstants";
import { CANVAS_DEFAULT_HEIGHT_PX } from "constants/AppConstants";
import { OccupiedSpace } from "constants/editorConstants";

export const calculateDropTargetRows = (
  widgetId: string,
  widgetBottomRow: number,
  currentDropTargetRows: number,
  occupiedSpacesByChildren?: OccupiedSpace[],
) => {
  /* Max bottom row including the existing widgets as well as the widget we just dropped */
  const maxBottomRow =
    occupiedSpacesByChildren &&
    Math.max(
      ...occupiedSpacesByChildren
        .filter(child => child.id !== widgetId)
        .map(child => child.bottom),
      widgetBottomRow,
    );

  let _rows = currentDropTargetRows;
  /* 
    If the main container's rows are greater than the max bottom row of children widgets (by 4)
    Update the rows of the container. Making sure that it does not go below the default canvas rows  
  */
  if (maxBottomRow && _rows - maxBottomRow > 2) {
    _rows = Math.max(
      maxBottomRow + 2,
      CANVAS_DEFAULT_HEIGHT_PX / GridDefaults.DEFAULT_GRID_ROW_HEIGHT - 1,
    );
  }
  return _rows + 1;
};
