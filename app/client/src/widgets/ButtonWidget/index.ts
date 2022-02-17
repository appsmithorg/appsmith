import {
  ButtonPlacementTypes,
  ButtonVariantTypes,
  RecaptchaTypes,
} from "components/constants";
import { Colors } from "constants/Colors";
import IconSVG from "./icon.svg";
import Widget from "./widget";

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
    rows: 4,
    columns: 16,
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
