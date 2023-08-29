import { isFunction } from "lodash";
import WidgetFactory from "utils/WidgetFactory";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";

export const getAutoLayoutDimensionsConfig = (props: BaseWidgetProps) => {
  let autoDimensionConfig = WidgetFactory.getWidgetAutoLayoutConfig(
    props.type,
  ).autoDimension;
  if (isFunction(autoDimensionConfig)) {
    autoDimensionConfig = autoDimensionConfig(props);
  }
  if (props.isListItemContainer && autoDimensionConfig) {
    autoDimensionConfig.height = false;
  }
  return autoDimensionConfig;
};

export const getAutoLayoutComponentDimensions = ({
  bottomRow,
  isFlexChild,
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
  if (isFlexChild && isMobile) {
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
