import Widget from "./widget";
import IconSVG from "./icon.svg";
import { CONFIG as BaseConfig } from "widgets/BaseInputWidget";
import { getDefaultISDCode } from "./component/ISDCodeDropdown";
import { LabelPosition } from "components/constants";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Phone Input",
  iconSVG: IconSVG,
  needsMeta: true,
  searchTags: ["call"],
  defaults: {
    ...BaseConfig.defaults,
    widgetName: "PhoneInput",
    version: 1,
    rows: 7,
    labelPosition: LabelPosition.Top,
    defaultDialCode: getDefaultISDCode().dial_code,
    allowDialCodeChange: false,
    allowFormatting: true,
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
    contentConfig: Widget.getPropertyPaneContentConfig(),
    styleConfig: Widget.getPropertyPaneStyleConfig(),
  },
};

export default Widget;
