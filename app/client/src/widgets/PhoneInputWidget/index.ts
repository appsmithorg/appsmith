import { LabelPosition } from "components/constants";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { getDefaultResponsiveBehavior } from "utils/layoutPropertiesUtils";
import { DynamicHeight } from "utils/WidgetFeatures";
import { CONFIG as BaseConfig } from "widgets/BaseInputWidget";
import { getDefaultISDCode } from "./component/ISDCodeDropdown";
import IconSVG from "./icon.svg";
import Widget from "./widget";

export const CONFIG = {
  features: {
    dynamicHeight: {
      sectionIndex: 3,
      defaultValue: DynamicHeight.FIXED,
      active: true,
    },
  },
  type: Widget.getWidgetType(),
  name: "Phone Input",
  iconSVG: IconSVG,
  needsMeta: true,
  searchTags: ["call"],
  defaults: {
    ...BaseConfig.defaults,
    widgetName: "PhoneInput",
    version: 1,
    rows: 7,
    labelPosition: LabelPosition.Top,
    defaultDialCode: getDefaultISDCode().dial_code,
    allowDialCodeChange: false,
    allowFormatting: true,
    responsiveBehavior: getDefaultResponsiveBehavior(Widget.getWidgetType()),
    minWidth: FILL_WIDGET_MIN_WIDTH,
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
      rows: 8,
    },
    mobile: {
      rows: 7,
    },
  },
};

export default Widget;
