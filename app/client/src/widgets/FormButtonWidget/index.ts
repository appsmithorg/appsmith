import { RecaptchaTypes } from "components/constants";
import IconSVG from "./icon.svg";
import { SnipablePropertyValueType } from "../BaseWidget";
import Widget from "./widget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "FormButton",
  iconSVG: IconSVG,
  hideCard: true,
  needsMeta: true,
  defaults: {
    rows: 4,
    columns: 12,
    widgetName: "FormButton",
    text: "Submit",
    isDefaultClickDisabled: true,
    recaptchaType: RecaptchaTypes.V3,
    version: 1,
    animateLoading: true,
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
  },
  sniping: {
    widgetType: Widget.getWidgetType(),
    isSnipable: true,
    snipableProperty: "onClick",
    shouldSetPropertyInputToJsMode: true,
    snipablePropertyValueType: SnipablePropertyValueType.RUN,
  },
};

export default Widget;
