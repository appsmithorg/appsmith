import { Alignment } from "@blueprintjs/core";
import IconSVG from "./icon.svg";
import Widget from "./widget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Switch Group", // The display name which will be made in uppercase and show in the widgets panel ( can have spaces )
  iconSVG: IconSVG,
  needsMeta: true, // Defines if this widget adds any meta properties
  isCanvas: false, // Defines if this widget has a canvas within in which we can drop other widgets
  defaults: {
    widgetName: "SwitchGroup",
    rows: 6,
    columns: 18,
    options: [
      { label: "Blue", value: "BLUE" },
      { label: "Green", value: "GREEN" },
      { label: "Red", value: "RED" },
    ],
    defaultSelectedValues: ["BLUE"],
    isDisabled: false,
    isRequired: false,
    isInline: true,
    isVisible: true,
    animateLoading: true,
    alignment: Alignment.LEFT,
    version: 1,
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
  },
};

export default Widget;
