import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";
import type { WidgetDefaultProps } from "WidgetProvider/constants";

export const defaultsConfig = {
  animateLoading: true,
  label: "Label",
  options: [
    { label: "Option 1", value: "1" },
    { label: "Option 2", value: "2" },
    { label: "Option 3", value: "3" },
  ],
  defaultOptionValue: "",
  isRequired: false,
  isDisabled: false,
  isVisible: true,
  isInline: false,
  widgetName: "ComboBox",
  widgetType: "COMBOBOX",
  version: 1,
  responsiveBehavior: ResponsiveBehavior.Fill,
} as unknown as WidgetDefaultProps;
