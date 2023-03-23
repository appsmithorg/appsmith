import { Alignment } from "@blueprintjs/core";
import { LabelPosition } from "components/constants";

import IconSVG from "./icon.svg";
import Widget from "./widget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Radio Group",
  iconSVG: IconSVG,
  needsMeta: true,
  features: {
    dynamicHeight: {
      sectionIndex: 3,
      active: true,
    },
  },
  searchTags: ["choice"],
  defaults: {
    rows: 6,
    columns: 20,
    animateLoading: true,
    label: "Label",
    labelPosition: LabelPosition.Top,
    labelAlignment: Alignment.LEFT,
    labelTextSize: "0.875rem",
    labelWidth: 5,
    options: [
      { label: "Yes", value: "Y" },
      { label: "No", value: "N" },
    ],
    defaultOptionValue: "Y",
    isRequired: false,
    isDisabled: false,
    isInline: true,
    alignment: Alignment.LEFT,
    widgetName: "RadioGroup",
    version: 1,
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
    contentConfig: Widget.getPropertyPaneContentConfig(),
    styleConfig: Widget.getPropertyPaneStyleConfig(),
    stylesheetConfig: Widget.getStylesheetConfig(),
  },
  autoLayout: {
    defaults: {
      columns: 14,
      rows: 7,
    },
    disabledPropsDefaults: {
      labelPosition: LabelPosition.Top,
    },
    autoDimension: {
      height: true,
    },
    widgetSize: [
      {
        viewportMinWidth: 0,
        configuration: () => {
          return {
            minWidth: "240px",
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
