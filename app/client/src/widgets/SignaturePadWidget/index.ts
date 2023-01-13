import Widget from "./widget";
import IconSVG from "./icon.svg";
import { Colors } from "@blueprintjs/core";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "SignaturePad",
  iconSVG: IconSVG,
  needsMeta: true,
  searchTags: ["sign", "signature pad", "pad", "draw"],
  features: {
    dynamicHeight: false,
  },
  defaults: {
    widgetName: "SignaturePad",
    rows: 18,
    columns: 25,
    version: 1,
    isDisabled: false,
    animateLoading: true,
    penColor: Colors.BLACK,
    padBackgroundColor: Colors.WHITE,
    label: "Sign here...",
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    contentConfig: Widget.getPropertyPaneContentConfig(),
    styleConfig: Widget.getPropertyPaneStyleConfig(),
  },
};

export default Widget;
