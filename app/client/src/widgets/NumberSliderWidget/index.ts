import { Alignment } from "@blueprintjs/core";

import { LabelPosition } from "components/constants";
import { getDefaultResponsiveBehavior } from "utils/layoutPropertiesUtils";

import IconSVG from "./icon.svg";
import Widget from "./widget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Number Slider",
  needsMeta: true,
  searchTags: ["range"],
  iconSVG: IconSVG,
  defaults: {
    min: 0,
    max: 100,
    step: 1,
    defaultValue: 10,
    showMarksLabel: true,
    marks: [
      { value: 25, label: "25%" },
      { value: 50, label: "50%" },
      { value: 75, label: "75%" },
    ],
    isVisible: true,
    isDisabled: false,
    tooltipAlwaysOn: false,
    rows: 8,
    columns: 40,
    widgetName: "NumberSlider",
    shouldScroll: false,
    shouldTruncate: false,
    version: 1,
    animateLoading: true,
    labelText: "Percentage",
    labelPosition: LabelPosition.Top,
    labelAlignment: Alignment.LEFT,
    labelWidth: 8,
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
