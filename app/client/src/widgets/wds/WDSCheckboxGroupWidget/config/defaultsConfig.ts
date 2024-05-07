import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";
import type { WidgetDefaultProps } from "WidgetProvider/constants";

export const defaultsConfig = {
  animateLoading: true,
  options: [
    { label: "Blue", value: "BLUE" },
    { label: "Green", value: "GREEN" },
    { label: "Red", value: "RED" },
  ],
  defaultSelectedValues: ["BLUE", "RED"],
  isDisabled: false,
  isRequired: false,
  isVisible: true,
  label: "Color",
  orientation: "vertical",
  version: 1,
  widgetName: "CheckboxGroup",
  responsiveBehavior: ResponsiveBehavior.Fill,
} as unknown as WidgetDefaultProps;
