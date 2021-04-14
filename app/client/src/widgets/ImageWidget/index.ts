import Widget from "./widget";
import IconSVG from "./icon.svg";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Image",
  iconSVG: IconSVG,
  defaults: {
    defaultImage:
      "https://res.cloudinary.com/drako999/image/upload/v1589196259/default.png",
    imageShape: "RECTANGLE",
    maxZoomLevel: 1,
    image: "",
    rows: 3,
    columns: 4,
    widgetName: "Image",
    version: 1,
  },
  properties: {
    validations: Widget.getPropertyValidationMap(),
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
  },
};

export default Widget;
