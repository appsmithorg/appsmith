import { ButtonVariantTypes } from "components/constants";
import { Colors } from "constants/Colors";
import IconSVG from "./icon.svg";
import Widget from "./widget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Button Group", // The display name which will be made in uppercase and show in the widgets panel ( can have spaces )
  iconSVG: IconSVG,
  needsMeta: false, // Defines if this widget adds any meta properties
  isCanvas: false, // Defines if this widget has a canvas within in which we can drop other widgets
  defaults: {
    rows: 4,
    columns: 24,
    widgetName: "ButtonGroup",
    orientation: "horizontal",
    buttonVariant: ButtonVariantTypes.PRIMARY,
    isVisible: true,
    version: 1,
    animateLoading: true,
    groupButtons: {
      groupButton1: {
        label: "Favorite",
        iconName: "heart",
        id: "groupButton1",
        widgetId: "",
        buttonColor: Colors.GREEN,
        buttonType: "SIMPLE",
        placement: "CENTER",
        isVisible: true,
        isDisabled: false,
        index: 0,
        menuItems: {},
      },
      groupButton2: {
        label: "Add",
        iconName: "add",
        id: "groupButton2",
        buttonColor: Colors.GREEN,
        buttonType: "SIMPLE",
        placement: "CENTER",
        widgetId: "",
        isVisible: true,
        isDisabled: false,
        index: 1,
        menuItems: {},
      },
      groupButton3: {
        label: "More",
        iconName: "more",
        id: "groupButton3",
        buttonType: "MENU",
        placement: "CENTER",
        buttonColor: Colors.GREEN,
        widgetId: "",
        isVisible: true,
        isDisabled: false,
        index: 2,
        menuItems: {
          menuItem1: {
            label: "First Option",
            backgroundColor: "#FFFFFF",
            id: "menuItem1",
            widgetId: "",
            onClick: "",
            isVisible: true,
            isDisabled: false,
            index: 0,
          },
          menuItem2: {
            label: "Second Option",
            backgroundColor: "#FFFFFF",
            id: "menuItem2",
            widgetId: "",
            onClick: "",
            isVisible: true,
            isDisabled: false,
            index: 1,
          },
          menuItem3: {
            label: "Delete",
            iconName: "trash",
            iconColor: "#FFFFFF",
            iconAlign: "right",
            textColor: "#FFFFFF",
            backgroundColor: "#DD4B34",
            id: "menuItem3",
            widgetId: "",
            onClick: "",
            isVisible: true,
            isDisabled: false,
            index: 2,
          },
        },
      },
    },
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
  },
};

export default Widget;
