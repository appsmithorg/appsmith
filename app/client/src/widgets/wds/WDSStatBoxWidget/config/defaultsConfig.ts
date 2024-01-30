import type { WidgetDefaultProps } from "WidgetProvider/constants";

export const defaultsConfig = {
  isVisible: true,
  widgetName: "StatBoxWidget",
  version: 1,
  animateLoading: true,
  valueImpact: "positive",
  valueChange: "+120%",
  value: "1500",
  label: "Active Users",
  sublabel: "Since 21 Jan 2022",
  icon: "user",
} as unknown as WidgetDefaultProps;
