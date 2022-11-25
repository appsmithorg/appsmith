import Widget from "./widget";
import IconSVG from "./icon.svg";
import { CONFIG as BaseConfig } from "widgets/BaseInputWidget";
import { LabelPosition } from "components/constants";
import { DynamicHeight } from "utils/WidgetFeatures";

export const CONFIG = {
  features: {
    dynamicHeight: {
      sectionIndex: 3,
      defaultValue: DynamicHeight.FIXED,
      active: true,
    },
  },
  type: Widget.getWidgetType(),
  name: "Input",
  iconSVG: IconSVG,
  needsMeta: true,
  searchTags: ["form", "text input", "number", "textarea"],
  defaults: {
    ...BaseConfig.defaults,
    rows: 7,
    labelPosition: LabelPosition.Top,
    inputType: "TEXT",
    widgetName: "Input",
    version: 2,
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
};

export default Widget;
