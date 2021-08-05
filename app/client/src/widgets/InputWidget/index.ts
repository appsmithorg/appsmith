import Widget from "./widget";
import IconSVG from "./icon.svg";
import { GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Input",
  iconSVG: IconSVG,
  needsMeta: true,
  defaults: {
    inputType: "TEXT",
    rows: 1 * GRID_DENSITY_MIGRATION_V1,
    label: "",
    columns: 5 * GRID_DENSITY_MIGRATION_V1,
    widgetName: "Input",
    version: 1,
    resetOnSubmit: true,
    isRequired: false,
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
