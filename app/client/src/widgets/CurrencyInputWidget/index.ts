import Widget from "./widget";
import IconSVG from "./icon.svg";
import { CONFIG as BaseConfig } from "widgets/BaseInputWidget";
import { getDefaultCurrency } from "./component/CurrencyCodeDropdown";
import { PropertyPaneConfigTypes } from "constants/PropertyControlConstants";

export const CONFIG = {
  features: {
    dynamicHeight: {
      enabled: true,
      propertyPaneConfigType: PropertyPaneConfigTypes.CONTENT,
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
  },
};

export default Widget;
