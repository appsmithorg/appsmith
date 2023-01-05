import { getResponsiveLayoutConfig } from "utils/layoutPropertiesUtils";
import Widget from "../../index";
export const ResponsiveBehaviorConfig = [
  ...getResponsiveLayoutConfig(Widget.getWidgetType()),
];
