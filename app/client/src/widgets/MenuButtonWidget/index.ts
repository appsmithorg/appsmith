import { ButtonPlacementTypes, ButtonVariantTypes } from "components/constants";
import { Colors } from "constants/Colors";
import IconSVG from "./icon.svg";
import Widget from "./widget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Menu Button",
  iconSVG: IconSVG,
  defaults: {
    label: "Open Menu",
    menuColor: Colors.GREEN,
    menuVariant: ButtonVariantTypes.PRIMARY,
    placement: ButtonPlacementTypes.CENTER,
    isCompact: false,
    isDisabled: false,
    isVisible: true,
    animateLoading: true,
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
    rows: 4,
    columns: 16,
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
