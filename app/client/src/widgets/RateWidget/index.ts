import { Colors } from "constants/Colors";
import IconSVG from "./icon.svg";
import Widget from "./widget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Rating",
  iconSVG: IconSVG,
  needsMeta: true,
  defaults: {
    rows: 4,
    columns: 10,
    animateLoading: true,
    maxCount: 5,
    defaultRate: 3,
    activeColor: Colors.RATE_ACTIVE,
    inactiveColor: Colors.ALTO_3,
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
