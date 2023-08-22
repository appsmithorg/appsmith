import { GridDefaults } from "constants/WidgetConstants";
import { isFunction } from "lodash";
import WidgetFactory from "utils/WidgetFactory";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";

export const useAutoLayoutEditor = (props: BaseWidgetProps) => {
  let autoDimensionConfig = WidgetFactory.getWidgetAutoLayoutConfig(
    props.type,
  ).autoDimension;
  if (isFunction(autoDimensionConfig)) {
    autoDimensionConfig = autoDimensionConfig(props);
  }
  if (props.isListItemContainer && autoDimensionConfig) {
    autoDimensionConfig.height = false;
  }
  return {
    autoDimensionConfig,
    getComponentDimensions: () => {
      const {
        bottomRow,
        leftColumn,
        mobileBottomRow = 0,
        mobileLeftColumn = 0,
        mobileRightColumn = 0,
        mobileTopRow = 0,
        rightColumn,
        topRow,
      } = props;
      const widthFromGridProps =
        ((rightColumn - leftColumn) * 100) / GridDefaults.DEFAULT_GRID_COLUMNS;
      const heightFromGridProps =
        (bottomRow - topRow) * GridDefaults.DEFAULT_GRID_ROW_HEIGHT;
      const mobileWidthValuesExist = mobileRightColumn + mobileLeftColumn > 0;
      const mobileHeightValuesExist = mobileBottomRow + mobileTopRow > 0;
      const mobileWidthFromGridProps = mobileWidthValuesExist
        ? ((mobileRightColumn - mobileLeftColumn) * 100) /
          GridDefaults.DEFAULT_GRID_COLUMNS
        : widthFromGridProps;
      const mobileHeightFromGridProps = mobileHeightValuesExist
        ? (mobileBottomRow - mobileTopRow) *
          GridDefaults.DEFAULT_GRID_ROW_HEIGHT
        : heightFromGridProps;
      return {
        componentWidth: props.isMobile
          ? props.mobileWidth || mobileWidthFromGridProps
          : props.width || widthFromGridProps,
        componentHeight: props.isMobile
          ? props.mobileHeight || mobileHeightFromGridProps
          : props.height || heightFromGridProps,
      };
    },
  };
};
