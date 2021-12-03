import Widget from "./widget";
import IconSVG from "./icon.svg";
import { GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "MultiSelect",
  iconSVG: IconSVG,
  needsMeta: true,
  defaults: {
    rows: 1.725 * GRID_DENSITY_MIGRATION_V1,
    columns: 5 * GRID_DENSITY_MIGRATION_V1,
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
