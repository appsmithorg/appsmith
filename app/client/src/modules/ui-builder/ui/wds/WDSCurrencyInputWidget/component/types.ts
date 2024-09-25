import type { CurrencyTypeOptions } from "constants/Currency";
import type { BaseInputComponentProps } from "modules/ui-builder/ui/wds/WDSBaseInputWidget";

export interface CurrencyInputComponentProps extends BaseInputComponentProps {
  currencyCode?: string;
  noOfDecimals?: number;
  allowCurrencyChange?: boolean;
  decimals?: number;
  onCurrencyChange: (
    code?: (typeof CurrencyTypeOptions)[number]["currency"],
  ) => void;
  defaultValue?: number;
}
