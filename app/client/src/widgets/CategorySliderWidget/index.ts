import { LabelPosition } from "components/constants";
import { Alignment } from "@blueprintjs/core";

import IconSVG from "./icon.svg";
import Widget from "./widget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Category Slider Widget",
  needsMeta: true,
  searchTags: ["range"],
  replacement: "CATEGORY_SLIDER_WIDGET",
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
    labelAlwaysOn: false,
    showLabelOnHover: true,
    showMarksLabel: false,
    rows: 8,
    columns: 35,
    widgetName: "CategorySlider",
    shouldScroll: false,
    shouldTruncate: false,
    version: 1,
    animateLoading: true,
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
  },
};

export default Widget;
