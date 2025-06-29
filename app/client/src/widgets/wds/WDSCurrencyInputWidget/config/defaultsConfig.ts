import {
  INPUT_TYPES,
  WDSBaseInputWidget,
} from "widgets/wds/WDSBaseInputWidget";
import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";
import type { WidgetDefaultProps } from "WidgetProvider/types";

import { getDefaultCurrency } from "../constants";

export const defaultsConfig = {
  ...WDSBaseInputWidget.getDefaults(),
  widgetName: "CurrencyInput",
  version: 1,
  allowCurrencyChange: false,
  defaultCurrencyCode: getDefaultCurrency().currency,
  decimals: 0,
  showStepArrows: false,
  label: "Current Price",
  responsiveBehavior: ResponsiveBehavior.Fill,
  inputType: INPUT_TYPES.CURRENCY,
} as WidgetDefaultProps;
