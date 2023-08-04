import type { BaseWidgetProps } from "widgets/BaseWidget/withBaseWidget";

export const useFixedLayoutViewer = ({
  rightColumn,
  leftColumn,
  topRow,
  bottomRow,
  parentColumnSpace,
  parentRowSpace,
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
