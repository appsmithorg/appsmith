import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";
import type { WidgetDefaultProps } from "WidgetProvider/constants";
import { SAMPLE_DATA } from "../widget/constants";

export const defaultsConfig = {
  animateLoading: true,
  label: "Label",
  sourceData: JSON.stringify(SAMPLE_DATA, null, 2),
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
