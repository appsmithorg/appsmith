import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";

export const defaultsConfig = {
  rows: 4,
  columns: 12,
  label: "Label",
  defaultCheckedState: true,
  widgetName: "Checkbox",
  version: 1,
  labelPosition: "left",
  isDisabled: false,
  isRequired: false,
  animateLoading: true,
  responsiveBehavior: ResponsiveBehavior.Fill,
  minWidth: FILL_WIDGET_MIN_WIDTH,
};
