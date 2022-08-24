import { LabelPosition } from "components/constants";
import { Alignment } from "@blueprintjs/core";

import IconSVG from "./icon.svg";
import Widget from "./widget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Range Slider",
  needsMeta: true,
  iconSVG: IconSVG,
  defaults: {
    defaultStartValue: 20,
    defaultEndValue: 40,
    min: 0,
    max: 100,
    minRange: 5,
    step: 1,
    showMarksLabel: true,
    marks: [
      { value: 20, label: "20%" },
      { value: 50, label: "50%" },
      { value: 75, label: "75%" },
      { value: 100, label: "100%" },
    ],
    isVisible: true,
    isDisabled: false,
    tooltipAlwaysOn: false,
    labelText: "Label",
    labelPosition: LabelPosition.Left,
    labelAlignment: Alignment.LEFT,
    labelWidth: 5,
    labelTextSize: "0.875rem",
    rows: 8,
    columns: 35,
    widgetName: "RangeSlider",
    shouldScroll: false,
    shouldTruncate: false,
    version: 1,
    animateLoading: true,
    sliderSize: "m",
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
    contentConfig: Widget.getPropertyPaneContentConfig(),
    styleConfig: Widget.getPropertyPaneStyleConfig(),
  },
};

export default Widget;
