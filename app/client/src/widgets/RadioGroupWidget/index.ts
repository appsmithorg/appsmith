import Widget from "./widget";
import IconSVG from "./icon.svg";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Radio Group",
  iconSVG: IconSVG,
  defaults: {
    rows: 2,
    columns: 3,
    label: "",
    options: [
      { label: "Male", value: "M" },
      { label: "Female", value: "F" },
    ],
    defaultOptionValue: "M",
    widgetName: "RadioGroup",
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
