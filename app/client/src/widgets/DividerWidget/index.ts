import Widget from "./widget";
import IconSVG from "./icon.svg";
import { GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";
import { Colors } from "constants/Colors";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Divider",
  iconSVG: IconSVG,
  defaults: {
    rows: 1 * GRID_DENSITY_MIGRATION_V1,
    columns: 2 * GRID_DENSITY_MIGRATION_V1,
    widgetName: "Divider",
    orientation: "horizontal",
    capType: "nc",
    capSide: 0,
    strokeStyle: "solid",
    dividerColor: Colors.LIGHT_GREY2,
    thickness: 2,
    isVisible: true,
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
