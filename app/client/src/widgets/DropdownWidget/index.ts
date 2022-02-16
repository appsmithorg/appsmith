import IconSVG from "./icon.svg";
import { SnipablePropertyValueType } from "../BaseWidget";
import Widget from "./widget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Select",
  iconSVG: IconSVG,
  needsMeta: true,
  hideCard: true,
  defaults: {
    rows: 7,
    columns: 20,
    placeholderText: "Select option",
    labelText: "Label",
    selectionType: "SINGLE_SELECT",
    options: [
      { label: "Blue", value: "BLUE" },
      { label: "Green", value: "GREEN" },
      { label: "Red", value: "RED" },
    ],
    serverSideFiltering: false,
    widgetName: "Select",
    defaultOptionValue: "GREEN",
    version: 1,
    isFilterable: false,
    isRequired: false,
    isDisabled: false,
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
    snipableProperty: "options",
    shouldSetPropertyInputToJsMode: true,
    snipablePropertyValueType: SnipablePropertyValueType.DATA,
  },
};

export default Widget;
