import IconSVG from "./icon.svg";
import Widget from "./widget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "MultiSelect",
  iconSVG: IconSVG,
  needsMeta: true,
  hideCard: true,
  defaults: {
    rows: 7,
    columns: 20,
    animateLoading: true,
    labelText: "Label",
    options: [
      { label: "Blue", value: "BLUE" },
      { label: "Green", value: "GREEN" },
      { label: "Red", value: "RED" },
    ],
    widgetName: "MultiSelect",
    serverSideFiltering: false,
    defaultOptionValue: ["GREEN"],
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
