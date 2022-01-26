import { Colors } from "constants/Colors";
import IconSVG from "./icon.svg";
import Widget from "./widget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Circular Progress",
  iconSVG: IconSVG,
  defaults: {
    counterClockWise: false,
    fillColor: Colors.GREEN,
    isVisible: true,
    progress: 65,
    showResult: true,

    rows: 17,
    columns: 16,
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
