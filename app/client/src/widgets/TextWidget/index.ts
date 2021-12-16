import Widget from "./widget";
import IconSVG from "./icon.svg";
import { GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Text",
  iconSVG: IconSVG,
  defaults: {
    text: "Label",
    fontSize: "PARAGRAPH",
    fontStyle: "BOLD",
    textAlign: "LEFT",
    textColor: "#231F20",
    truncateButtonColor: "#FFC13D",
    rows: 1 * GRID_DENSITY_MIGRATION_V1,
    columns: 4 * GRID_DENSITY_MIGRATION_V1,
    widgetName: "Text",
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
