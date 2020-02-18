import { XYCoord } from "react-dnd";
import { WidgetProps, WidgetRowCols } from "widgets/BaseWidget";
import { GridDefaults } from "constants/WidgetConstants";

export type UIElementSize = { height: number; width: number };

export const RESIZABLE_CONTAINER_BORDER_THEME_INDEX = 1;

export const computeRowCols = (
  delta: UIElementSize,
  position: XYCoord,
  props: WidgetProps,
) => {
  return {
    leftColumn: Math.round(
      props.leftColumn + position.x / props.parentColumnSpace,
    ),
    topRow: Math.round(props.topRow + position.y / props.parentRowSpace),
    rightColumn: Math.round(
      props.rightColumn + (delta.width + position.x) / props.parentColumnSpace,
    ),
    bottomRow: Math.round(
      props.bottomRow + (delta.height + position.y) / props.parentRowSpace,
    ),
  };
};

export const computeBoundedRowCols = (rowCols: WidgetRowCols) => {
  return {
    leftColumn: Math.max(rowCols.leftColumn, 0),
    rightColumn: Math.min(
      rowCols.rightColumn,
      GridDefaults.DEFAULT_GRID_COLUMNS,
    ),
    topRow: rowCols.topRow,
    bottomRow: rowCols.bottomRow,
  };
};

export const hasRowColsChanged = (
  newRowCols: WidgetRowCols,
  props: WidgetProps,
) => {
  return (
    props.leftColumn !== newRowCols.leftColumn ||
    props.topRow !== newRowCols.topRow ||
    props.bottomRow !== newRowCols.bottomRow ||
    props.rightColumn !== newRowCols.rightColumn
  );
};

export const computeFinalRowCols = (
  delta: UIElementSize,
  position: XYCoord,
  props: WidgetProps,
): WidgetRowCols | false => {
  const newRowCols = computeBoundedRowCols(
    computeRowCols(delta, position, props),
  );
  return hasRowColsChanged(newRowCols, props) ? newRowCols : false;
};
