import type { WidgetDefaultProps } from "WidgetProvider/constants";
import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";

export const defaultsConfig = {
  isVisible: true,
  widgetName: "StatsWidget",
  version: 1,
  animateLoading: true,
  valueColor: "neutral",
  valueChange: "+50%",
  valueChangeColor: "positive",
  value: "42",
  label: "Active Users",
  caption: "This week",
  iconName: "shopping-bag",
  responsiveBehavior: ResponsiveBehavior.Fill,
  elevatedBackground: false,
} as unknown as WidgetDefaultProps;
