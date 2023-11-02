import type { BaseInputComponentProps } from "widgets/wds/WDSBaseInputWidget";

export interface CurrencyInputComponentProps extends BaseInputComponentProps {
  currencyCode?: string;
  noOfDecimals?: number;
  allowCurrencyChange?: boolean;
  decimals?: number;
  onCurrencyChange: (code?: any) => void;
}
