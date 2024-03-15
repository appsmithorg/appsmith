import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";
import type { WidgetDefaultProps } from "WidgetProvider/constants";

export const defaultsConfig = {
  animateLoading: true,
  label: "Label",
  options: [
    { label: "Yes", value: "Y" },
    { label: "No", value: "N" },
  ],
  defaultOptionValue: "Y",
  isRequired: false,
  isDisabled: false,
  isInline: true,
  widgetName: "RadioGroup",
  version: 1,
  responsiveBehavior: ResponsiveBehavior.Fill,
} as unknown as WidgetDefaultProps;
