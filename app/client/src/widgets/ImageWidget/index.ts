import IconSVG from "./icon.svg";
import Widget from "./widget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Image",
  iconSVG: IconSVG,
  defaults: {
    defaultImage: "https://assets.appsmith.com/widgets/default.png",
    imageShape: "RECTANGLE",
    maxZoomLevel: 1,
    enableRotation: false,
    enableDownload: false,
    objectFit: "contain",
    image: "",
    rows: 12,
    columns: 12,
    widgetName: "Image",
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
