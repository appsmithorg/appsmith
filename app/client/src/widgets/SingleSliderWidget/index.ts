import { TAILWIND_COLORS } from "constants/ThemeConstants";

import IconSVG from "./icon.svg";
import Widget from "./widget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Single Slider Widget",
  needsMeta: true,
  replacement: "SINGLE_SLIDER_WIDGET",
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
    fillColor: TAILWIND_COLORS.green["600"],
    isVisible: true,
    labelAlwaysOn: false,
    showLabelOnHover: true,

    rows: 8,
    columns: 35,
    widgetName: "SingleSlider",
    shouldScroll: false,
    shouldTruncate: false,
    version: 1,
    animateLoading: true,
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
  },
};

export default Widget;
