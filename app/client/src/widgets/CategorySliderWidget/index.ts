import { Alignment } from "@blueprintjs/core";

import { LabelPosition } from "components/constants";
import { getDefaultResponsiveBehavior } from "utils/layoutPropertiesUtils";

import IconSVG from "./icon.svg";
import Widget from "./widget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Category Slider",
  needsMeta: true,
  searchTags: ["range"],
  iconSVG: IconSVG,
  defaults: {
    options: [
      { label: "xs", value: "xs" },
      { label: "sm", value: "sm" },
      { label: "md", value: "md" },
      { label: "lg", value: "lg" },
      { label: "xl", value: "xl" },
    ],
    defaultOptionValue: "md",
    isVisible: true,
    isDisabled: false,
    showMarksLabel: true,
    rows: 8,
    columns: 40,
    widgetName: "CategorySlider",
    shouldScroll: false,
    shouldTruncate: false,
    version: 1,
    animateLoading: true,
    labelText: "Size",
    labelPosition: LabelPosition.Top,
    labelAlignment: Alignment.LEFT,
    labelWidth: 5,
    labelTextSize: "0.875rem",
    sliderSize: "m",
    responsiveBehavior: getDefaultResponsiveBehavior(Widget.getWidgetType()),
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    contentConfig: Widget.getPropertyPaneContentConfig(),
    styleConfig: Widget.getPropertyPaneStyleConfig(),
    stylesheetConfig: Widget.getStylesheetConfig(),
  },
  autoLayout: {
    widgetSize: [
      {
        viewportMinWidth: 0,
        configuration: () => {
          return {
            minWidth: "150px",
          };
        },
      },
    ],
  },
};

export default Widget;
