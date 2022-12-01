import { Alignment } from "@blueprintjs/core";
import { LabelPosition } from "components/constants";
import { DynamicHeight } from "utils/WidgetFeatures";
import IconSVG from "./icon.svg";
import Widget from "./widget";

export const CONFIG = {
  features: {
    dynamicHeight: {
      sectionIndex: 3,
      defaultValue: DynamicHeight.FIXED,
      active: true,
    },
  },
  type: Widget.getWidgetType(),
  name: "TreeSelect",
  searchTags: ["dropdown"],
  iconSVG: IconSVG,
  needsMeta: true,
  defaults: {
    rows: 7,
    columns: 20,
    animateLoading: true,
    options: [
      {
        label: "Blue",
        value: "BLUE",
        children: [
          {
            label: "Dark Blue",
            value: "DARK BLUE",
          },
          {
            label: "Light Blue",
            value: "LIGHT BLUE",
          },
        ],
      },
      { label: "Green", value: "GREEN" },
      { label: "Red", value: "RED" },
    ],
    widgetName: "TreeSelect",
    defaultOptionValue: "BLUE",
    version: 1,
    isVisible: true,
    isRequired: false,
    isDisabled: false,
    allowClear: false,
    expandAll: false,
    placeholderText: "Select option",
    labelText: "Label",
    labelPosition: LabelPosition.Top,
    labelAlignment: Alignment.LEFT,
    labelWidth: 5,
    labelTextSize: "0.875rem",
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
    contentConfig: Widget.getPropertyPaneContentConfig(),
    styleConfig: Widget.getPropertyPaneStyleConfig(),
    stylesheetConfig: Widget.getStylesheetConfig(),
  },
};

export default Widget;
