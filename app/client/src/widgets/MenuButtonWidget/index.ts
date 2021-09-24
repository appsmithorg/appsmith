import Widget from "./widget";
import IconSVG from "./icon.svg";
import { GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";
import { Colors } from "constants/Colors";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Menu Button",
  iconSVG: IconSVG,
  defaults: {
    label: "Open Menu",
    menuColor: Colors.GREEN,
    menuVariant: "SOLID",
    isCompact: false,
    isDisabled: false,
    isVisible: true,
    menuItems: {
      menuItem1: {
        label: "First Menu Item",
        id: "menuItem1",
        widgetId: "",
        isVisible: true,
        isDisabled: false,
        index: 0,
      },
      menuItem2: {
        label: "Second Menu Item",
        id: "menuItem2",
        widgetId: "",
        isVisible: true,
        isDisabled: false,
        index: 1,
      },
      menuItem3: {
        label: "Third Menu Item",
        id: "menuItem3",
        widgetId: "",
        isVisible: true,
        isDisabled: false,
        index: 2,
      },
    },
    rows: 1 * GRID_DENSITY_MIGRATION_V1,
    columns: 4 * GRID_DENSITY_MIGRATION_V1,
    widgetName: "MenuButton",
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
