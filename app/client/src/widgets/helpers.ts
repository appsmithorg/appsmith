import { WidgetPositionProps } from "widgets/NewBaseWidget";
export const getWidgetDimensions = (
  positionProps: WidgetPositionProps,
): {
  componentWidth: number;
  componentHeight: number;
} => {
  const {
    rightColumn,
    leftColumn,
    parentColumnSpace,
    bottomRow,
    topRow,
    parentRowSpace,
  } = positionProps;
  return {
    componentWidth: (rightColumn - leftColumn) * parentColumnSpace,
    componentHeight: (bottomRow - topRow) * parentRowSpace,
  };
};
