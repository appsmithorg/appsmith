import type { WidgetDefaultProps } from "WidgetProvider/constants";
import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";

export const defaultsConfig = {
  isVisible: true,
  widgetName: "StatBoxWidget",
  version: 1,
  animateLoading: true,
  valueImpact: "positive",
  valueChange: "+50%",
  value: "42",
  label: "Active Users",
  sublabel: "This week",
  iconName: "shopping-bag",
  responsiveBehavior: ResponsiveBehavior.Fill,
} as unknown as WidgetDefaultProps;
