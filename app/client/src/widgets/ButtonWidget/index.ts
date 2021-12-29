import Widget from "./widget";
import IconSVG from "./icon.svg";
import { GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";
import { Colors } from "constants/Colors";
import {
  ButtonPlacementTypes,
  ButtonVariantTypes,
  RecaptchaTypes,
} from "components/constants";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Button",
  iconSVG: IconSVG,
  needsMeta: true,
  defaults: {
    animateLoading: true,
    text: "Submit",
    buttonColor: Colors.GREEN,
    buttonVariant: ButtonVariantTypes.PRIMARY,
    placement: ButtonPlacementTypes.CENTER,
    rows: 1 * GRID_DENSITY_MIGRATION_V1,
    columns: 4 * GRID_DENSITY_MIGRATION_V1,
    widgetName: "Button",
    isDisabled: false,
    isVisible: true,
    isDefaultClickDisabled: true,
    recaptchaType: RecaptchaTypes.V3,
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
