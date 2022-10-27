import { Alignment } from "@blueprintjs/core";
import { LabelPosition } from "components/constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Checkbox Group",
  iconSVG: IconSVG,
  needsMeta: true,
  defaults: {
    rows: 6,
    columns: 23,
    animateLoading: true,
    labelTextSize: "0.875rem",
    options: [
      { label: "Blue", value: "BLUE" },
      { label: "Green", value: "GREEN" },
      { label: "Red", value: "RED" },
    ],
    defaultSelectedValues: "BLUE",
    isDisabled: false,
    isInline: true,
    isRequired: false,
    isVisible: true,
    labelText: "Label",
    labelPosition: LabelPosition.Top,
    labelAlignment: Alignment.LEFT,
    labelWidth: 5,
    widgetName: "CheckboxGroup",
    version: 2,
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
    contentConfig: Widget.getPropertyPaneContentConfig(),
    styleConfig: Widget.getPropertyPaneStyleConfig(),
  },
};

export default Widget;
