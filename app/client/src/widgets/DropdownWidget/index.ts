import Widget from "./widget";
import IconSVG from "./icon.svg";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Dropdown",
  iconSVG: IconSVG,
  defaults: {
    rows: 1,
    columns: 5,
    label: "",
    selectionType: "SINGLE_SELECT",
    options: [
      { label: "Vegetarian", value: "VEG" },
      { label: "Non-Vegetarian", value: "NON_VEG" },
      { label: "Vegan", value: "VEGAN" },
    ],
    widgetName: "Dropdown",
    defaultOptionValue: "VEG",
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
