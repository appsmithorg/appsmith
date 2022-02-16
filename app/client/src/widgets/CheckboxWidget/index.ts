import Widget from "./widget";
import IconSVG from "./icon.svg";
import { SnipablePropertyValueType } from "../BaseWidget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Checkbox",
  iconSVG: IconSVG,
  needsMeta: true,
  defaults: {
    rows: 4,
    columns: 20,
    label: "Label",
    defaultCheckedState: true,
    widgetName: "Checkbox",
    version: 1,
    alignWidget: "LEFT",
    isDisabled: false,
    isRequired: false,
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
    snipableProperty: "defaultCheckedState",
    shouldSetPropertyInputToJsMode: true,
    snipablePropertyValueType: SnipablePropertyValueType.DATA,
  },
};

export default Widget;
