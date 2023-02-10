import { LabelPosition } from "components/constants";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { getDefaultResponsiveBehavior } from "utils/layoutPropertiesUtils";
import { DynamicHeight } from "utils/WidgetFeatures";
import { CONFIG as BaseConfig } from "widgets/BaseInputWidget";
import { getDefaultCurrency } from "./component/CurrencyCodeDropdown";
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
  name: "Currency Input",
  iconSVG: IconSVG,
  needsMeta: true,
  searchTags: ["amount", "total"],
  defaults: {
    ...BaseConfig.defaults,
    widgetName: "CurrencyInput",
    version: 1,
    rows: 7,
    labelPosition: LabelPosition.Top,
    allowCurrencyChange: false,
    defaultCurrencyCode: getDefaultCurrency().currency,
    decimals: 0,
    showStepArrows: false,
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
    widgetSize: [
      {
        viewportMinWidth: 0,
        configuration: () => {
          return {
            minWidth: "180px",
          };
        },
      },
    ],
  },
};

export default Widget;
