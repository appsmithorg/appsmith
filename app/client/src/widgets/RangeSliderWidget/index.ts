import { Alignment } from "@blueprintjs/core";
import { LabelPosition } from "components/constants";
import { ResponsiveBehavior } from "utils/autoLayout/constants";

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
    responsiveBehavior: ResponsiveBehavior.Fill,
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
    disabledPropsDefaults: {
      labelPosition: LabelPosition.Top,
      labelTextSize: "0.875rem",
    },
    defaults: {
      rows: 7,
      columns: 40,
    },
    widgetSize: [
      {
        viewportMinWidth: 0,
        configuration: () => {
          return {
            minWidth: "180px",
            minHeight: "70px",
          };
        },
      },
    ],
    disableResizeHandles: {
      vertical: true,
    },
  },
};

export default Widget;
