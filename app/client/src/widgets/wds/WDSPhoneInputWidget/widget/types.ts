import type { CountryCode } from "libphonenumber-js";
import type { BaseInputWidgetProps } from "widgets/wds/WDSBaseInputWidget";

export interface PhoneInputWidgetProps extends BaseInputWidgetProps {
  dialCode?: string;
  countryCode?: CountryCode;
  defaultText?: string;
  allowDialCodeChange: boolean;
}
