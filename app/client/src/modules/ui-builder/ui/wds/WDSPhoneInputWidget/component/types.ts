import type { CountryCode } from "libphonenumber-js";
import type { BaseInputComponentProps } from "modules/ui-builder/ui/wds/WDSBaseInputWidget";

export interface PhoneInputComponentProps extends BaseInputComponentProps {
  dialCode?: string;
  countryCode?: CountryCode;
  onISDCodeChange: (code?: string) => void;
  allowDialCodeChange: boolean;
}
