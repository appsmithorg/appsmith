import Widget from "./widget";
import IconSVG from "./icon.svg";
import { GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";

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
    rows: 3 * GRID_DENSITY_MIGRATION_V1,
    columns: 3 * GRID_DENSITY_MIGRATION_V1,
    widgetName: "Image",
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
