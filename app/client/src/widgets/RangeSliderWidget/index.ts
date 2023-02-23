import { Alignment } from "@blueprintjs/core";

import { LabelPosition } from "components/constants";
import { getDefaultResponsiveBehavior } from "utils/layoutPropertiesUtils";

import IconSVG from "./icon.svg";
import Widget from "./widget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Range Slider",
  needsMeta: true,
  iconSVG: IconSVG,
  defaults: {
    min: 0,
    max: 100,
    minRange: 5,
    step: 1,
    showMarksLabel: true,
    defaultStartValue: 10,
    defaultEndValue: 100,
    marks: [
      { value: 25, label: "25%" },
      { value: 50, label: "50%" },
      { value: 75, label: "75%" },
    ],
    isVisible: true,
    isDisabled: false,
    tooltipAlwaysOn: false,
    labelText: "Percentage",
    labelPosition: LabelPosition.Top,
    labelAlignment: Alignment.LEFT,
    labelWidth: 8,
    labelTextSize: "0.875rem",
    rows: 8,
    columns: 40,
    widgetName: "RangeSlider",
    shouldScroll: false,
    shouldTruncate: false,
    version: 1,
    animateLoading: true,
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
            minWidth: "180px",
          };
        },
      },
    ],
  },
};

export default Widget;
