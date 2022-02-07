import IconSVG from "./icon.svg";
import Widget from "./widget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "TreeSelect",
  iconSVG: IconSVG,
  needsMeta: true,
  defaults: {
    rows: 7,
    columns: 20,
    animateLoading: true,
    options: [
      {
        label: "Blue",
        value: "BLUE",
        children: [
          {
            label: "Dark Blue",
            value: "DARK BLUE",
          },
          {
            label: "Light Blue",
            value: "LIGHT BLUE",
          },
        ],
      },
      { label: "Green", value: "GREEN" },
      { label: "Red", value: "RED" },
    ],
    widgetName: "TreeSelect",
    defaultOptionValue: "BLUE",
    version: 1,
    isVisible: true,
    isRequired: false,
    isDisabled: false,
    allowClear: false,
    expandAll: false,
    placeholderText: "Select option",
    labelText: "Label",
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
  },
};

export default Widget;
