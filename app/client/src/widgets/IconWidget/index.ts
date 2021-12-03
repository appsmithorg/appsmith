import Widget from "./widget";
import IconSVG from "./icon.svg";
import { GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Icon",
  iconSVG: IconSVG,
  hideCard: true,
  defaults: {
    widgetName: "Icon",
    rows: 1 * GRID_DENSITY_MIGRATION_V1,
    columns: 1 * GRID_DENSITY_MIGRATION_V1,
    version: 1,
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
  },
};

export default Widget;
