import Widget from "./widget";
import IconSVG from "./icon.svg";
import { GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";
import { Colors } from "constants/Colors";
import { BarType } from "./constants";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Progress Bar", // The display name which will be made in uppercase and show in the widgets panel ( can have spaces )
  iconSVG: IconSVG,
  needsMeta: false, // Defines if this widget adds any meta properties
  isCanvas: false, // Defines if this widget has a canvas within in which we can drop other widgets
  defaults: {
    widgetName: "ProgressBar",
    rows: 0.9 * GRID_DENSITY_MIGRATION_V1,
    columns: 7 * GRID_DENSITY_MIGRATION_V1,
    isVisible: true,
    fillColor: Colors.GREEN,
    showResult: false,
    barType: BarType.INDETERMINATE,
    progress: 50,
    steps: 1,
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
