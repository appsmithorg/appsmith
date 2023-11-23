import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";

export const defaultsConfig = {
  rows: 10,
  columns: 20,
  animateLoading: true,
  options: [
    { label: "Blue", value: "BLUE" },
    { label: "Green", value: "GREEN" },
    { label: "Red", value: "RED" },
  ],
  defaultSelectedValues: ["BLUE"],
  isDisabled: false,
  isRequired: false,
  isVisible: true,
  labelPosition: "left",
  label: "Label",
  orientation: "vertical",
  version: 1,
  widgetName: "SwitchGroup",
  responsiveBehavior: ResponsiveBehavior.Fill,
  minWidth: FILL_WIDGET_MIN_WIDTH,
};
