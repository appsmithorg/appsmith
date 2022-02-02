import { IconNames } from "@blueprintjs/icons";
import {
  ButtonBorderRadiusTypes,
  ButtonBoxShadowTypes,
  ButtonVariantTypes,
} from "components/constants";
import { Colors } from "constants/Colors";
import IconSVG from "./icon.svg";
import Widget from "./widget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Icon Button",
  iconSVG: IconSVG,
  defaults: {
    iconName: IconNames.PLUS,
    borderRadius: ButtonBorderRadiusTypes.CIRCLE,
    boxShadow: ButtonBoxShadowTypes.NONE,
    buttonColor: Colors.GREEN,
    buttonVariant: ButtonVariantTypes.PRIMARY,
    isDisabled: false,
    isVisible: true,
    rows: 4,
    columns: 4,
    widgetName: "IconButton",
    version: 1,
    animateLoading: true,
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
  },
};

export default Widget;
