import Widget from "./widget";
import IconSVG from "./icon.svg";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Input",
  iconSVG: IconSVG,
  defaults: {
    inputType: "TEXT",
    rows: 1,
    label: "",
    columns: 5,
    widgetName: "Input",
    version: 1,
    resetOnSubmit: true,
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
