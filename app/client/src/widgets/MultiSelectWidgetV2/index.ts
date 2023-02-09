import { Alignment } from "@blueprintjs/core";
import { LabelPosition } from "components/constants";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { getDefaultResponsiveBehavior } from "utils/layoutPropertiesUtils";
import { DynamicHeight } from "utils/WidgetFeatures";
import IconSVG from "./icon.svg";
import Widget from "./widget";

export const CONFIG = {
  features: {
    dynamicHeight: {
      sectionIndex: 4,
      defaultValue: DynamicHeight.FIXED,
      active: true,
    },
  },
  type: Widget.getWidgetType(),
  name: "MultiSelect",
  iconSVG: IconSVG,
  needsMeta: true,
  searchTags: ["dropdown", "tags"],
  defaults: {
    rows: 7,
    columns: 20,
    animateLoading: true,
    labelText: "Label",
    labelPosition: LabelPosition.Top,
    labelAlignment: Alignment.LEFT,
    labelWidth: 5,
    labelTextSize: "0.875rem",
    options: [
      { label: "Blue", value: "BLUE" },
      { label: "Green", value: "GREEN" },
      { label: "Red", value: "RED" },
    ],
    widgetName: "MultiSelect",
    isFilterable: true,
    serverSideFiltering: false,
    defaultOptionValue: ["GREEN", "RED"],
    version: 1,
    isRequired: false,
    isDisabled: false,
    placeholderText: "Select option(s)",
    responsiveBehavior: getDefaultResponsiveBehavior(Widget.getWidgetType()),
    minWidth: FILL_WIDGET_MIN_WIDTH,
  },
  autoLayout: {
    widgetSize: [
      {
        viewportMinWidth: 0,
        configuration: () => {
          return {
            minWidth: "120px",
            minHeight: "70px",
          };
        },
      },
    ],
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
