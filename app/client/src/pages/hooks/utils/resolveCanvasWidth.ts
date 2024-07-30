import { layoutConfigurations } from "constants/WidgetConstants";
import type { SupportedLayouts } from "reducers/entityReducers/pageListReducer";

interface CalculateCanvasWidthProps {
  appLayoutType: SupportedLayouts;
  containerWidth: number;
}

export const resolveCanvasWidth = ({
  appLayoutType,
  containerWidth,
}: CalculateCanvasWidthProps) => {
  const { maxWidth, minWidth } = layoutConfigurations[appLayoutType];

  switch (true) {
    case maxWidth < 0:
    case containerWidth >= minWidth && containerWidth <= maxWidth:
      return Math.trunc(containerWidth);
    case containerWidth < minWidth:
      return minWidth;
    case containerWidth > maxWidth:
      return maxWidth;
    default:
      return minWidth;
  }
};
