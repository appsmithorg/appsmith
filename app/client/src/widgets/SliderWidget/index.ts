import { LabelPosition } from "components/constants";
import { Alignment } from "@blueprintjs/core";

import IconSVG from "./icon.svg";
import Widget from "./widget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Slider Widget",
  needsMeta: true,
  searchTags: ["range"],
  replacement: "SLIDER_WIDGET",
  iconSVG: IconSVG,
  defaults: {
    defaultValue: 50,
    min: 0,
    max: 100,
    step: 1,
    marks: [
      { value: 20, label: "20%" },
      { value: 50, label: "50%" },
      { value: 75, label: "75%" },
      { value: 100, label: "100%" },
    ],
    isVisible: true,
    isDisabled: false,
    labelAlwaysOn: false,
    showLabelOnHover: true,
    rows: 8,
    columns: 35,
    widgetName: "Slider",
    shouldScroll: false,
    shouldTruncate: false,
    version: 1,
    animateLoading: true,
    labelText: "Label",
    labelPosition: LabelPosition.Left,
    labelAlignment: Alignment.LEFT,
    labelWidth: 5,
    labelTextSize: "0.875rem",
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
  },
};

export default Widget;
