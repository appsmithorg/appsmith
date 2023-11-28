import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";

export const defaultsConfig = {
  rows: 6,
  columns: 20,
  animateLoading: true,
  label: "Label",
  labelPosition: "left",
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
  minWidth: FILL_WIDGET_MIN_WIDTH,
};
