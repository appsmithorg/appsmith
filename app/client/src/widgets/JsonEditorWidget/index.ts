import Widget from "./widget";
import IconSVG from "./icon.svg";
import { GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Json Editor", // The display name which will be made in uppercase and show in the widgets panel ( can have spaces )
  iconSVG: IconSVG,
  needsMeta: true, // Defines if this widget adds any meta properties
  isCanvas: false, // Defines if this widget has a canvas within in which we can drop other widgets
  defaults: {
    widgetName: "JsonEditor",
    rows: 8.5 * GRID_DENSITY_MIGRATION_V1,
    columns: 8 * GRID_DENSITY_MIGRATION_V1,
    version: 1,

    isVisible: true,
    defaultText: JSON.stringify(
      {
        fruits: ["apple", "orange", "lemon"],
      },
      null,
      2,
    ),
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
  },
};

export default Widget;
