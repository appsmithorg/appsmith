import type { WidgetRowCols } from "widgets/BaseWidget";
import { GridDefaults } from "constants/WidgetConstants";
import type { XYCord } from "layoutSystems/common/canvasArenas/ArenaTypes";
import { ReflowDirection } from "reflow/reflowTypes";
import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";

export interface UIElementSize {
  height: number;
  width: number;
}

export const RESIZABLE_CONTAINER_BORDER_THEME_INDEX = 1;

export interface WidgetPosition {
  rightColumn: number;
  leftColumn: number;
  bottomRow: number;
  topRow: number;
  parentRowSpace: number;
  parentColumnSpace: number;
}

export type WidgetExtendedPosition = WidgetPosition & {
  paddingOffset: number;
};

const computeAutoLayoutRowCols = (
  delta: UIElementSize,
  position: XYCord,
  props: WidgetPosition,
) => {
  return {
    leftColumn: Math.round(
      props.leftColumn + position.x / props.parentColumnSpace,
    ),
    topRow: Math.round(props.topRow + position.y / props.parentRowSpace),
    rightColumn: Math.round(
      props.rightColumn + delta.width / props.parentColumnSpace,
    ),
    bottomRow: Math.round(
      props.bottomRow + delta.height / props.parentRowSpace,
    ),
  };
};

export const computeRowCols = (
  delta: UIElementSize,
  position: XYCord,
  props: WidgetPosition,
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
  props: WidgetPosition,
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
  position: XYCord,
  widgetPositionProps: WidgetPosition,
): WidgetRowCols | false => {
  const newRowCols = computeBoundedRowCols(
    computeRowCols(delta, position, widgetPositionProps),
  );

  return hasRowColsChanged(newRowCols, widgetPositionProps)
    ? newRowCols
    : false;
};

export const computeFinalAutoLayoutRowCols = (
  delta: UIElementSize,
  position: XYCord,
  widgetPositionProps: WidgetPosition,
): WidgetRowCols | false => {
  const newRowCols = computeBoundedRowCols(
    computeAutoLayoutRowCols(delta, position, widgetPositionProps),
  );

  return hasRowColsChanged(newRowCols, widgetPositionProps)
    ? newRowCols
    : false;
};

/**
 * A rudimentary function which based on horizontal and vertical resize enabled
 * tells us whether a resize handle in a particular direction works
 * Note: This works only if vertical or horizontal directions are provided.
 * @param horizontalEnabled : boolean
 * @param verticalEnabled : boolean
 * @param direction : ReflowDirection
 * @returns if resize is allowed in the direction provided
 * Works only for vertical and horizontal directions
 */
export function isHandleResizeAllowed(
  horizontalEnabled: boolean,
  verticalEnabled: boolean,
  direction?: ReflowDirection,
): boolean {
  if (direction === ReflowDirection.TOP || direction === ReflowDirection.BOTTOM)
    return verticalEnabled;
  else if (
    direction === ReflowDirection.LEFT ||
    direction === ReflowDirection.RIGHT
  ) {
    return horizontalEnabled;
  }

  return true;
}

export function isResizingDisabled(
  handles: { horizontal?: boolean; vertical?: boolean } = {},
  direction?: ReflowDirection,
  isFlexChild?: boolean,
  responsiveBehavior?: ResponsiveBehavior,
) {
  const { horizontal = false, vertical = false } = handles;

  if (
    (direction === ReflowDirection.TOP ||
      direction === ReflowDirection.BOTTOM ||
      direction === ReflowDirection.BOTTOMLEFT ||
      direction === ReflowDirection.BOTTOMRIGHT) &&
    vertical
  )
    return true;

  if (
    direction === ReflowDirection.RIGHT ||
    direction === ReflowDirection.LEFT
  ) {
    if (
      horizontal ||
      (isFlexChild && responsiveBehavior === ResponsiveBehavior.Fill)
    )
      return true;
  }

  return false;
}
