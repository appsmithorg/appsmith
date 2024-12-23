import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";
import type { WidgetDefaultProps } from "WidgetProvider/constants";

export const defaultsConfig = {
  animateLoading: true,
  label: "Label",
  sourceData: JSON.stringify(
    [
      { name: "Blue", code: "BLUE" },
      { name: "Green", code: "GREEN" },
      { name: "Red", code: "RED" },
    ],
    null,
    2,
  ),
  optionLabel: "name",
  optionValue: "code",
  defaultOptionValue: "",
  isRequired: false,
  isDisabled: false,
  isVisible: true,
  isInline: false,
  widgetName: "Select",
  widgetType: "SELECT",
  version: 1,
  responsiveBehavior: ResponsiveBehavior.Fill,
  dynamicPropertyPathList: [{ key: "sourceData" }],
  placeholderText: "Select an item",
} as unknown as WidgetDefaultProps;
