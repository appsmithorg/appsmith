import Widget from "./widget";
import IconSVG from "./icon.svg";
import { GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";
import { Colors } from "constants/Colors";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Divider",
  iconSVG: IconSVG,
  defaults: {
    rows: GRID_DENSITY_MIGRATION_V1,
    columns: 5 * GRID_DENSITY_MIGRATION_V1,
    widgetName: "Divider",
    orientation: "horizontal",
    capType: "nc",
    capSide: 0,
    strokeStyle: "solid",
    dividerColor: Colors.GREY_3,
    thickness: 2,
    isVisible: true,
    version: 1,
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
