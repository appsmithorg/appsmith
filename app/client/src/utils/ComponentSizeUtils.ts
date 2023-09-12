import { AppPositioningTypes } from "reducers/entityReducers/pageListReducer";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";

/**
 * getAutoLayoutComponentDimensions
 *
 * utility function to compute a widgets dimensions in Auto layout system
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
    componentHeight: (bottomRow - topRow) * parentRowSpace,
  };
};

export const getComponentDimensions = (
  props: BaseWidgetProps,
  appPositioningType: AppPositioningTypes,
  isMobile: boolean,
): {
  componentHeight: number;
  componentWidth: number;
} => {
  switch (appPositioningType) {
    case AppPositioningTypes.AUTO:
      return getAutoLayoutComponentDimensions({ ...props, isMobile });
    default:
      return getFixedLayoutComponentDimensions(props);
  }
};
