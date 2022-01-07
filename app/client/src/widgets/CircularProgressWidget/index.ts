import { GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";
import { Colors } from "constants/Colors";
import Widget from "./widget";
import IconSVG from "./icon.svg";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Circular Progress",
  iconSVG: IconSVG,
  defaults: {
    backgroundColor: Colors.WHITE,
    backgroundPadding: 0,
    counterClockwise: false,
    maxValue: 100,
    pathColor: "#38AFF4",
    strokeWidth: 6,
    successColor: "#03b365",
    successTextColor: Colors.THUNDER,
    successValue: 100,
    textColor: Colors.THUNDER,
    textSize: 20,
    trailColor: Colors.GRAY,
    value: 65,
    rows: 4.25 * GRID_DENSITY_MIGRATION_V1,
    columns: 4 * GRID_DENSITY_MIGRATION_V1,
    widgetName: "CircularProgress",
    shouldScroll: false,
    shouldTruncate: false,
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
