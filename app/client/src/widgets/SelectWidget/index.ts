import Widget from "./widget";
import IconSVG from "./icon.svg";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Select",
  iconSVG: IconSVG,
  needsMeta: true,
  defaults: {
    rows: 4,
    columns: 20,
    placeholderText: "Select option",
    labelText: "",
    options: [
      { label: "Blue", value: "BLUE" },
      { label: "Green", value: "GREEN" },
      { label: "Red", value: "RED" },
    ],
    serverSideFiltering: false,
    widgetName: "Select",
    defaultOptionValue: "GREEN",
    version: 1,
    isFilterable: true,
    isRequired: false,
    isDisabled: false,
    animateLoading: true,
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
  },
};

export default Widget;
