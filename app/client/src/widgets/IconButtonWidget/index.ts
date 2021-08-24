import Widget from "./widget";
import IconSVG from "./icon.svg";
import { IconNames } from "@blueprintjs/icons";
import { ButtonStyleTypes, ButtonVariantTypes } from "components/constants";
import { GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";
import {
  ButtonBorderRadiusTypes,
  ButtonBoxShadowTypes,
} from "components/constants";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "IconButton",
  iconSVG: IconSVG,
  defaults: {
    iconName: IconNames.PLUS,
    borderRadius: ButtonBorderRadiusTypes.CIRCLE,
    boxShadow: ButtonBoxShadowTypes.NONE,
    buttonStyle: ButtonStyleTypes.PRIMARY,
    buttonVariant: ButtonVariantTypes.SOLID,
    isDisabled: false,
    isVisible: true,
    rows: 1 * GRID_DENSITY_MIGRATION_V1,
    columns: 1 * GRID_DENSITY_MIGRATION_V1,
    widgetName: "IconButton",
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
