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
