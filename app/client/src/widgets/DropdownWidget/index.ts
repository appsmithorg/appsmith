import { Alignment } from "@blueprintjs/core";
import { LabelPosition } from "components/constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Select",
  iconSVG: IconSVG,
  needsMeta: true,
  hideCard: true,
  isDeprecated: true,
  replacement: "SELECT_WIDGET",
  defaults: {
    rows: 7,
    columns: 20,
    placeholderText: "Select option",
    labelText: "Label",
    labelPosition: LabelPosition.Left,
    labelAlignment: Alignment.LEFT,
    labelWidth: 5,
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
    stylesheetConfig: Widget.getStylesheetConfig(),
  },
};

export default Widget;
