import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";
import type { WidgetDefaultProps } from "WidgetProvider/constants";

export const defaultsConfig = {
  label: "Label",
  defaultSwitchState: true,
  widgetName: "Switch",
  labelPosition: "start",
  version: 1,
  isDisabled: false,
  isVisible: true,
  animateLoading: true,
  responsiveBehavior: ResponsiveBehavior.Fill,
} as unknown as WidgetDefaultProps;
