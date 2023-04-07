import { Alignment } from "@blueprintjs/core";
import { LabelPosition } from "components/constants";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { ResponsiveBehavior } from "utils/autoLayout/constants";

import IconSVG from "./icon.svg";
import Widget from "./widget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "MultiSelect",
  iconSVG: IconSVG,
  needsMeta: true,
  hideCard: true,
  isDeprecated: true,
  replacement: "MULTI_SELECT_WIDGET_V2",
  defaults: {
    rows: 7,
    columns: 20,
    animateLoading: true,
    labelText: "Label",
    labelPosition: LabelPosition.Left,
    labelAlignment: Alignment.LEFT,
    labelWidth: 5,
    options: [
      { label: "Blue", value: "BLUE" },
      { label: "Green", value: "GREEN" },
      { label: "Red", value: "RED" },
    ],
    widgetName: "MultiSelect",
    serverSideFiltering: false,
    defaultOptionValue: ["GREEN"],
    version: 1,
    isRequired: false,
    isDisabled: false,
    placeholderText: "Select option(s)",
    responsiveBehavior: ResponsiveBehavior.Fill,
    minWidth: FILL_WIDGET_MIN_WIDTH,
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
