import { LabelPosition } from "components/constants";
import { Alignment } from "@blueprintjs/core";

import IconSVG from "./icon.svg";
import Widget from "./widget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Number Slider",
  needsMeta: true,
  searchTags: ["range"],
  iconSVG: IconSVG,
  defaults: {
    defaultValue: 50,
    min: 0,
    max: 100,
    step: 1,
    options: [
      { label: "xs", value: "xs" },
      { label: "sm", value: "sm" },
      { label: "md", value: "md" },
      { label: "lg", value: "lg" },
      { label: "xl", value: "xl" },
    ],
    defaultOptionValue: "md",
    marks: [
      { value: 20, label: "20%" },
      { value: 50, label: "50%" },
      { value: 75, label: "75%" },
      { value: 100, label: "100%" },
    ],
    isVisible: true,
    isDisabled: false,
    tooltipAlwaysOn: false,
    rows: 8,
    columns: 35,
    widgetName: "NumberSlider",
    shouldScroll: false,
    shouldTruncate: false,
    version: 1,
    animateLoading: true,
    labelText: "Label",
    labelPosition: LabelPosition.Left,
    labelAlignment: Alignment.LEFT,
    labelWidth: 5,
    labelTextSize: "0.875rem",
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
