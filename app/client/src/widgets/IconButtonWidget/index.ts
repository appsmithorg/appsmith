import { IconNames } from "@blueprintjs/icons";
import { ButtonVariantTypes } from "components/constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Icon Button",
  iconSVG: IconSVG,
  searchTags: ["click", "submit"],
  defaults: {
    iconName: IconNames.PLUS,
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
    contentConfig: Widget.getPropertyPaneContentConfig(),
    styleConfig: Widget.getPropertyPaneStyleConfig(),
    stylesheetConfig: Widget.getStylesheetConfig(),
  },
};

export default Widget;
