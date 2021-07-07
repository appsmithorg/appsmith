import Widget from "./widget";
import IconSVG from "./icon.svg";
import { GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Rich Text Editor",
  iconSVG: IconSVG,
  defaults: {
    defaultText: "This is the initial <b>content</b> of the editor",
    rows: 5 * GRID_DENSITY_MIGRATION_V1,
    columns: 8 * GRID_DENSITY_MIGRATION_V1,
    isDisabled: false,
    isVisible: true,
    widgetName: "RichTextEditor",
    isDefaultClickDisabled: true,
    inputType: "html",
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
