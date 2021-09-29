import { WidgetProps } from "widgets/BaseWidget";
import { DSLWidget } from "widgets/constants";
import { ISDCodeProps, ISDCodeOptions } from "constants/ISDCodes";

export const migrateInputWidgetDefaultSelectedPhoneNumberCode = (
  currentDSL: DSLWidget,
) => {
  currentDSL.children = currentDSL.children?.map((child: WidgetProps) => {
    if (child.type === "INPUT_WIDGET") {
      if (child.inputType === "PHONE_NUMBER" && child.phoneNumberCountryCode) {
        const ISDCodeOption = ISDCodeOptions.find((item: ISDCodeProps) => {
          return item.code === child.phoneNumberCountryCode;
        });
        // eslint-disable-next-line no-console
        console.log({ ISDCodeOption });
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
