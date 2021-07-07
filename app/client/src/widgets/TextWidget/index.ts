import Widget from "./widget";
import IconSVG from "./icon.svg";
import { GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Text",
  iconSVG: IconSVG,
  defaults: {
    text: "Label",
    fontSize: "PARAGRAPH", // Make these into appsmith defaults: For example. AppsmithFontSizes.PARAGRAPH
    fontStyle: "BOLD", // Make these into general defaults: For example. FontStyles.BOLD,
    textAlign: "LEFT", // Make these into general defaults: For example. TextAlignments.LEFT
    textColor: "#231F20", // Make these into appsmith defaults. For example. AppsmithColors.defaultText
    renderAsHTML: true,
    rows: 1 * GRID_DENSITY_MIGRATION_V1,
    columns: 4 * GRID_DENSITY_MIGRATION_V1,
    widgetName: "Text",
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
