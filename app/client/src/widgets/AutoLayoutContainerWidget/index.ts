import Widget from "./widget";
import IconSVG from "./icon.svg";
import { ButtonBoxShadowTypes } from "components/constants";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "AutoLayout Container", // The display name which will be made in uppercase and show in the widgets panel ( can have spaces )
  iconSVG: IconSVG,
  needsMeta: false, // Defines if this widget adds any meta properties
  isCanvas: true, // Defines if this widget has a canvas within in which we can drop other widgets
  searchTags: ["auto layout", "flex", "div", "parent", "group"],
  defaults: {
    widgetName: "AutoLayoutContainer",
    rows: 40,
    columns: 24,
    version: 1,
    backgroundColor: "#FFFFFF",
    containerStyle: "card",
    borderColor: "transparent",
    borderWidth: "0",
    boxShadow: ButtonBoxShadowTypes.NONE,
    animateLoading: true,
    children: [],
    blueprint: {
      view: [
        {
          type: "CANVAS_WIDGET",
          position: { top: 0, left: 0 },
          props: {
            containerStyle: "none",
            canExtend: false,
            detachFromLayout: true,
            children: [],
          },
        },
      ],
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
