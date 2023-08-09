import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";

export const useFixedLayoutViewer = ({
  bottomRow,
  leftColumn,
  parentColumnSpace,
  parentRowSpace,
  rightColumn,
  topRow,
}: BaseWidgetProps) => {
  return {
    getComponentDimensions: () => {
      return {
        componentWidth: (rightColumn - leftColumn) * parentColumnSpace,
        componentHeight: (bottomRow - topRow) * parentRowSpace,
      };
    },
  };
};
