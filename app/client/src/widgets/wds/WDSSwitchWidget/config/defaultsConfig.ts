import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";

export const defaultsConfig = {
  label: "Label",
  rows: 4,
  columns: 12,
  defaultSwitchState: true,
  widgetName: "Switch",
  labelPosition: "left",
  version: 1,
  isDisabled: false,
  animateLoading: true,
  responsiveBehavior: ResponsiveBehavior.Fill,
  minWidth: FILL_WIDGET_MIN_WIDTH,
};
