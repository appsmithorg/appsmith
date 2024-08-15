import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";
import type { WidgetDefaultProps } from "WidgetProvider/constants";

export const defaultsConfig = {
  animateLoading: true,
  label: "Size",
  options: [
    { label: "Small", value: "S" },
    { label: "Medium", value: "M" },
    { label: "Large", value: "L" },
  ],
  defaultOptionValue: "L",
  isRequired: false,
  isDisabled: false,
  isVisible: true,
  isInline: true,
  widgetName: "RadioGroup",
  orientation: "vertical",
  version: 1,
  responsiveBehavior: ResponsiveBehavior.Fill,
} as unknown as WidgetDefaultProps;
