import { WidgetProps } from "widgets/BaseWidget";
import { DSLWidget } from "widgets/constants";
import { ISDCodeProps, ISDCodeOptions } from "constants/ISDCodes";
import { CurrencyOptionProps, CurrencyTypeOptions } from "constants/Currency";

export const migrateInputWidgetDefaultSelectedPhoneNumberCode = (
  currentDSL: DSLWidget,
) => {
  currentDSL.children = currentDSL.children?.map((child: WidgetProps) => {
    for (const key in child) {
      if (
        typeof child[key] === "string" &&
        child[key].includes(".currencyCountryCode")
      ) {
        child[key] = child[key].replace(
          ".currencyCountryCode",
          ".currencyCode",
        );
      } else if (
        typeof child[key] === "string" &&
        child[key].includes(".countryCode")
      ) {
        child[key] = child[key].replace(".countryCode", ".dialCode");
      }
    }
    if (child.type === "INPUT_WIDGET") {
      if (child.inputType === "PHONE_NUMBER" && child.phoneNumberCountryCode) {
        const ISDCodeOption = ISDCodeOptions.find((item: ISDCodeProps) => {
          return item.code === child.phoneNumberCountryCode;
        });
        if (ISDCodeOption) {
          child.phoneNumberCountryCode = ISDCodeOption.dial_code;
        }
      }
      if (child.inputType === "CURRENCY" && child.currencyCode) {
        const CurrencyTypeOption = CurrencyTypeOptions.find(
          (item: CurrencyOptionProps) => {
            return item.code === child.currencyCode;
          },
        );
        if (CurrencyTypeOption) {
          child.currencyCode = CurrencyTypeOption.currency;
        }
      }
    } else if (child.children && child.children.length > 0) {
      child = migrateInputWidgetDefaultSelectedPhoneNumberCode(child);
    }

    return child;
  });
  return currentDSL;
};
