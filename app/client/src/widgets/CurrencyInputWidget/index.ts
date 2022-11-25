import Widget from "./widget";
import IconSVG from "./icon.svg";
import { CONFIG as BaseConfig } from "widgets/BaseInputWidget";
import { getDefaultCurrency } from "./component/CurrencyCodeDropdown";
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
