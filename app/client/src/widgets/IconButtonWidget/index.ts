import Widget from "./widget";
import IconSVG from "./icon.svg";
import { IconNames } from "@blueprintjs/icons";
import { ButtonVariantTypes } from "components/constants";
import { GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Icon Button",
  iconSVG: IconSVG,
  defaults: {
    iconName: IconNames.PLUS,
    buttonVariant: ButtonVariantTypes.PRIMARY,
    isDisabled: false,
    isVisible: true,
    rows: 1 * GRID_DENSITY_MIGRATION_V1,
    columns: 1 * GRID_DENSITY_MIGRATION_V1,
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
