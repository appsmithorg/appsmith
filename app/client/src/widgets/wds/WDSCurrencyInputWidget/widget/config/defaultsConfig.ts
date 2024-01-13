import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { WDSBaseInputWidget } from "widgets/wds/WDSBaseInputWidget";
import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";

import { getDefaultCurrency } from "../../constants";

export const defaultsConfig = {
  ...WDSBaseInputWidget.getDefaults(),
  widgetName: "CurrencyInput",
  version: 1,
  rows: 7,
  allowCurrencyChange: false,
  defaultCurrencyCode: getDefaultCurrency().currency,
  decimals: 0,
  showStepArrows: false,
  responsiveBehavior: ResponsiveBehavior.Fill,
  minWidth: FILL_WIDGET_MIN_WIDTH,
};
