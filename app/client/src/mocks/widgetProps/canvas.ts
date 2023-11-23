import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";
import { generateReactKey } from "utils/generators";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";

export const mockCanvasProps = (): BaseWidgetProps => ({
  type: "CANVAS_WIDGET",
  widgetId: generateReactKey(),
  widgetName: "Canvas1",
  renderMode: "CANVAS",
  version: 1,
  isLoading: false,
  parentColumnSpace: 10,
  parentRowSpace: 10,
  leftColumn: 0,
  rightColumn: 30,
  topRow: 0,
  bottomRow: 5,
  layout: undefined,
  responsiveBehavior: ResponsiveBehavior.Fill,
});
