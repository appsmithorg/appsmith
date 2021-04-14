import Widget from "./widget";
import IconSVG from "./icon.svg";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Switch",
  iconSVG: IconSVG,
  defaults: {
    label: "Label",
    rows: 1,
    columns: 2,
    defaultSwitchState: true,
    widgetName: "Switch",
    alignWidget: "LEFT",
    version: 1,
  },
  properties: {
    validations: Widget.getPropertyValidationMap(),
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
  },
};

export default Widget;
