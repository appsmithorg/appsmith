import { GridDefaults } from "constants/WidgetConstants";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";

export const getAutoLayoutComponentDimensions = ({
  bottomRow,
  isMobile,
  leftColumn,
  mobileBottomRow,
  mobileLeftColumn,
  mobileRightColumn,
  mobileTopRow,
  parentColumnSpace,
  parentRowSpace,
  rightColumn,
  topRow,
}: BaseWidgetProps) => {
  let left = leftColumn;
  let right = rightColumn;
  let top = topRow;
  let bottom = bottomRow;
  if (isMobile) {
    if (mobileLeftColumn !== undefined && parentColumnSpace !== 1) {
      left = mobileLeftColumn;
    }
    if (mobileRightColumn !== undefined && parentColumnSpace !== 1) {
      right = mobileRightColumn;
    }
    if (mobileTopRow !== undefined && parentRowSpace !== 1) {
      top = mobileTopRow;
    }
    if (mobileBottomRow !== undefined && parentRowSpace !== 1) {
      bottom = mobileBottomRow;
    }
  }

  return {
    componentWidth: (right - left) * parentColumnSpace,
    componentHeight: (bottom - top) * parentRowSpace,
  };
};

export const getFixedLayoutComponentDimensions = ({
  bottomRow,
  leftColumn,
  parentColumnSpace,
  parentRowSpace,
  rightColumn,
  topRow,
}: BaseWidgetProps) => {
  return {
    componentWidth: (rightColumn - leftColumn) * parentColumnSpace,
    componentHeight: (bottomRow - topRow) * parentRowSpace,
  };
};

export const getAnvilComponentDimensions = ({
  bottomRow,
  height,
  leftColumn,
  rightColumn,
  topRow,
  width,
}: BaseWidgetProps) => {
  /**
   * Anvil widgets are part of a fluid layout.
   * Component width is calculated as a percentage of the grid width.
   * Component height is calculated in pixels.
   */
  return {
    componentWidth:
      width ||
      ((rightColumn - leftColumn) * 100) / GridDefaults.DEFAULT_GRID_COLUMNS,
    componentHeight:
      height || (bottomRow - topRow) * GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
  };
};

export const getComponentDimensions = (
  props: BaseWidgetProps,
  isAutoLayout: boolean,
  isMobile: boolean,
): {
  componentHeight: number;
  componentWidth: number;
} => {
  return isAutoLayout
    ? getAutoLayoutComponentDimensions({ ...props, isMobile })
    : getFixedLayoutComponentDimensions(props);
};
