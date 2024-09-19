import { GridDefaults } from "constants/WidgetConstants";
import { LayoutSystemTypes } from "layoutSystems/types";
import memo from "micro-memoize";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";

/**
 * getAutoLayoutComponentDimensions
 *
 * utility function to compute a widgets dimensions in Auto layout system
 *
 * The Auto-Layout Layout system uses the mobile breakpoints for layouts.
 * For this reason, the rows and columns occupied in the mobile breakpoint,
 * and the rows and columns occupied in other viewport widths can be different.
 * As a result, we check if we're in the mobile breakpoint using the isMobile,
 * and use the appropriate leftColumn, rightColumn, topRow and bottomRow
 * (with or without the mobile prefix depending on the isMobile value) to compute the component dimensions.
 * The components here are the widgets.
 *
 */
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

/**
 * getFixedLayoutComponentDimensions
 *
 * utility function to compute a widgets dimensions in Fixed layout system
 *
 */
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
    componentHeight:
      (bottomRow - topRow) *
      (parentRowSpace || GridDefaults.DEFAULT_GRID_ROW_HEIGHT),
  };
};

export const getComponentDimensions = memo(
  (
    props: BaseWidgetProps,
    layoutSystemType: LayoutSystemTypes,
    isMobile = false,
  ): {
    componentHeight?: number;
    componentWidth?: number;
  } => {
    switch (layoutSystemType) {
      case LayoutSystemTypes.ANVIL:
        return {};
      case LayoutSystemTypes.AUTO:
        return getAutoLayoutComponentDimensions({ ...props, isMobile });
      default:
        return getFixedLayoutComponentDimensions(props);
    }
  },
);
