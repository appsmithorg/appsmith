import Widget from "./widget";
import IconSVG from "./icon.svg";
import { GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Switch",
  iconSVG: IconSVG,
  needsMeta: true,
  defaults: {
    label: "Label",
    rows: 1 * GRID_DENSITY_MIGRATION_V1,
    columns: 3 * GRID_DENSITY_MIGRATION_V1,
    defaultSwitchState: true,
    widgetName: "Switch",
    alignWidget: "LEFT",
    version: 1,
    isDisabled: false,
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
  },
};

export default Widget;
