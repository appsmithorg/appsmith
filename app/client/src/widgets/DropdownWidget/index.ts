import Widget from "./widget";
import IconSVG from "./icon.svg";
import { GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Dropdown",
  iconSVG: IconSVG,
  defaults: {
    rows: 1 * GRID_DENSITY_MIGRATION_V1,
    columns: 5 * GRID_DENSITY_MIGRATION_V1,
    label: "",
    selectionType: "SINGLE_SELECT",
    options: [
      { label: "Blue", value: "BLUE" },
      { label: "Green", value: "GREEN" },
      { label: "Red", value: "RED" },
    ],
    widgetName: "Select",
    defaultOptionValue: "GREEN",
    version: 1,
    isRequired: false,
    isDisabled: false,
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
  },
};

export default Widget;
