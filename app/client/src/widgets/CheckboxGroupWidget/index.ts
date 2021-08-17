import Widget from "./widget";
import IconSVG from "./icon.svg";
import { GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "CheckboxGroup",
  iconSVG: IconSVG,
  withMeta: true,
  defaults: {
    rows: 2 * GRID_DENSITY_MIGRATION_V1,
    columns: 1.5 * GRID_DENSITY_MIGRATION_V1,
    options: [
      { label: "Apple", value: "apple" },
      { label: "Orange", value: "orange" },
      { label: "Lemon", value: "lemon" },
    ],
    defaultSelectedValues: "apple",
    isDisabled: false,
    isRequired: false,
    isVisible: true,
    widgetName: "CheckboxGroup",
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
