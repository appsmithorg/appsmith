import Widget from "./widget";
import IconSVG from "./icon.svg";
import { GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "TreeSelect",
  iconSVG: IconSVG,
  needsMeta: true,
  defaults: {
    rows: 1.725 * GRID_DENSITY_MIGRATION_V1,
    columns: 5 * GRID_DENSITY_MIGRATION_V1,
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
