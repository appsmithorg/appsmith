import Widget from "./widget";
import IconSVG from "./icon.svg";
import { GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Radio Group",
  iconSVG: IconSVG,
  needsMeta: true,
  defaults: {
    rows: 2 * GRID_DENSITY_MIGRATION_V1,
    columns: 3 * GRID_DENSITY_MIGRATION_V1,
    label: "",
    options: [
      { label: "Yes", value: "Y" },
      { label: "No", value: "N" },
    ],
    defaultOptionValue: "Y",
    widgetName: "RadioGroup",
    version: 1,
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
