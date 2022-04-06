import { ButtonBoxShadowTypes } from "components/constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Container",
  iconSVG: IconSVG,
  isCanvas: true,
  defaults: {
    backgroundColor: "#FFFFFF",
    rows: 40,
    columns: 24,
    widgetName: "Container",
    containerStyle: "card",
    borderColor: "transparent",
    borderWidth: "0",
    borderRadius: "0",
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
