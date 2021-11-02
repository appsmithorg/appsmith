import Widget from "./widget";
import IconSVG from "./icon.svg";
import { GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";
import { SnipablePropertyValueType } from "../BaseWidget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Input",
  iconSVG: IconSVG,
  needsMeta: true,
  defaults: {
    inputType: "TEXT",
    rows: GRID_DENSITY_MIGRATION_V1,
    label: "",
    columns: 5 * GRID_DENSITY_MIGRATION_V1,
    widgetName: "Input",
    version: 1,
    defaultText: "",
    iconAlign: "left",
    autoFocus: false,
    labelStyle: "",
    resetOnSubmit: true,
    isRequired: false,
    isDisabled: false,
    allowCurrencyChange: false,
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
    snipableProperty: "defaultText",
    shouldSetPropertyInputToJsMode: true,
    snipablePropertyValueType: SnipablePropertyValueType.DATA,
  },
};

export default Widget;
