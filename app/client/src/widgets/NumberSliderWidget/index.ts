import { Alignment } from "@blueprintjs/core";
import { LabelPosition } from "components/constants";
import { ResponsiveBehavior } from "utils/autoLayout/constants";

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
