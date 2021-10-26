import Widget from "./widget";
import IconSVG from "./icon.svg";
import { GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";
import { Colors } from "constants/Colors";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Rating",
  iconSVG: IconSVG,
  needsMeta: true,
  defaults: {
    rows: 1 * GRID_DENSITY_MIGRATION_V1,
    columns: 2.5 * GRID_DENSITY_MIGRATION_V1,
    maxCount: 5,
    defaultRate: 3,
    activeColor: Colors.RATE_ACTIVE,
    inactiveColor: Colors.RATE_INACTIVE,
    size: "LARGE",
    isRequired: false,
    isAllowHalf: false,
    isDisabled: false,
    tooltips: ["Terrible", "Bad", "Neutral", "Good", "Great"],
    widgetName: "Rating",
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
  },
};

export default Widget;
