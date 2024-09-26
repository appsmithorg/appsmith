import type { CurrencyTypeOptions } from "constants/Currency";
import type { BaseInputWidgetProps } from "modules/ui-builder/ui/wds/WDSBaseInputWidget";

export interface CurrencyInputWidgetProps extends BaseInputWidgetProps {
  countryCode?: string;
  currencyCode?: (typeof CurrencyTypeOptions)[number]["currency"];
  noOfDecimals?: number;
  allowCurrencyChange?: boolean;
  decimals?: number;
  defaultText?: number;
}
