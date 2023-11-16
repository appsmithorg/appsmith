<<<<<<< HEAD
=======
import type { CurrencyTypeOptions } from "constants/Currency";
>>>>>>> ff87f5acb928d293937d20b7c1a4d02d20e78426
import type { BaseInputComponentProps } from "widgets/wds/WDSBaseInputWidget";

export interface CurrencyInputComponentProps extends BaseInputComponentProps {
  currencyCode?: string;
  noOfDecimals?: number;
  allowCurrencyChange?: boolean;
  decimals?: number;
<<<<<<< HEAD
  onCurrencyChange: (code?: any) => void;
=======
  onCurrencyChange: (
    code?: (typeof CurrencyTypeOptions)[number]["currency"],
  ) => void;
>>>>>>> ff87f5acb928d293937d20b7c1a4d02d20e78426
}
