import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";
import { generateReactKey } from "utils/generators";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";

export const mockButtonProps = (): BaseWidgetProps => ({
  type: "BUTTON_WIDGET",
  widgetId: generateReactKey(),
  widgetName: "Button1",
  renderMode: "CANVAS",
  version: 1,
  isLoading: false,
  parentColumnSpace: 10,
  parentRowSpace: 10,
  leftColumn: 0,
  rightColumn: 10,
  topRow: 0,
  bottomRow: 4,
  responsiveBehavior: ResponsiveBehavior.Hug,
});
