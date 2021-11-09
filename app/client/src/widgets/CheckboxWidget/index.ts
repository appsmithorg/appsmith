import Widget from "./widget";
import IconSVG from "./icon.svg";
import { Colors } from "constants/Colors";
import { GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Checkbox",
  iconSVG: IconSVG,
  needsMeta: true,
  defaults: {
    rows: 1 * GRID_DENSITY_MIGRATION_V1,
    columns: 3 * GRID_DENSITY_MIGRATION_V1,
    label: "Label",
    defaultCheckedState: true,
    widgetName: "Checkbox",
    version: 1,
    alignWidget: "LEFT",
    isDisabled: false,
    isRequired: false,
    backgroundColor: Colors.GREEN,
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
  },
};

export default Widget;
