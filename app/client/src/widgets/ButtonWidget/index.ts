import Widget from "./widget";
import IconSVG from "./icon.svg";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Button",
  iconSVG: IconSVG,
  defaults: {
    text: "Submit",
    buttonStyle: "PRIMARY_BUTTON",
    rows: 1,
    columns: 2,
    widgetName: "Button",
    isDisabled: false,
    isVisible: true,
    isDefaultClickDisabled: true,
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
