import Widget from "./widget";
import IconSVG from "./icon.svg";
import { CONFIG as BaseConfig } from "widgets/BaseInputWidget";
import { getDefaultISDCode } from "./component/ISDCodeDropdown";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Phone Input",
  iconSVG: IconSVG,
  needsMeta: true,
  defaults: {
    ...BaseConfig.defaults,
    widgetName: "PhoneInput",
    version: 1,
    dialCode: getDefaultISDCode().dial_code,
    allowDialCodeChange: false,
    allowFormatting: true,
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
  },
};

export default Widget;
