import { AlignWidgetTypes } from "WidgetProvider/constants";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { LabelPosition } from "design-system-old";
import { ResponsiveBehavior } from "layoutSystems/autolayout/utils/constants";

export const defaultsConfig = {
  rows: 4,
  columns: 12,
  label: "Label",
  defaultCheckedState: true,
  widgetName: "Checkbox",
  version: 1,
  alignWidget: AlignWidgetTypes.LEFT,
  labelPosition: LabelPosition.Left,
  isDisabled: false,
  isRequired: false,
  animateLoading: true,
  responsiveBehavior: ResponsiveBehavior.Fill,
  minWidth: FILL_WIDGET_MIN_WIDTH,
};
