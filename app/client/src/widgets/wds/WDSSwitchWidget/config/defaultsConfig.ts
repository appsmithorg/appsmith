import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";
import type { WidgetDefaultProps } from "WidgetProvider/constants";

export const defaultsConfig = {
  label: "Label",
  defaultSwitchState: true,
  widgetName: "Switch",
  labelPosition: "left",
  version: 1,
  isDisabled: false,
  animateLoading: true,
  responsiveBehavior: ResponsiveBehavior.Fill,
} as unknown as WidgetDefaultProps;
