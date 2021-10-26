import { WidgetProps } from "widgets/BaseWidget";
import { DSLWidget } from "widgets/constants";
import { ISDCodeProps, ISDCodeOptions } from "constants/ISDCodes";

export const migrateInputWidgetDefaultSelectedPhoneNumberCode = (
  currentDSL: DSLWidget,
) => {
  currentDSL.children = currentDSL.children?.map((child: WidgetProps) => {
    for (const key in child) {
      if (
        typeof child[key] === "string" &&
        child[key].includes(".currencyCountryCode")
      )
        child[key] = child[key].replace(
          ".currencyCountryCode",
          ".currencyCode",
        );
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
    } else if (child.children && child.children.length > 0) {
      child = migrateInputWidgetDefaultSelectedPhoneNumberCode(child);
    }

    return child;
  });
  return currentDSL;
};
