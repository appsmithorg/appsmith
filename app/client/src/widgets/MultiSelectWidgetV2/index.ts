import Widget from "./widget";
import IconSVG from "./icon.svg";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "MultiSelect",
  iconSVG: IconSVG,
  needsMeta: true,
  defaults: {
    rows: 4,
    columns: 20,
    animateLoading: true,
    labelText: "",
    options: [
      { label: "Blue", value: "BLUE" },
      { label: "Green", value: "GREEN" },
      { label: "Red", value: "RED" },
    ],
    widgetName: "MultiSelect",
    isFilterable: true,
    serverSideFiltering: false,
    defaultOptionValue: ["GREEN", "RED"],
    version: 1,
    isRequired: false,
    isDisabled: false,
    placeholderText: "Select option(s)",
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
  },
};

export default Widget;
